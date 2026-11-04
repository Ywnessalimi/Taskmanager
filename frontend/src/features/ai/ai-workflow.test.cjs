const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

function workflow(request) {
  const source = fs.readFileSync(path.join(__dirname, 'ai-workflow.ts'), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const modules = {
    '@/lib/api/backend-client': { backendRequest: request },
    '@/lib/api/tasks': { createTask: async () => { throw new Error('unexpected create') } },
    '@/features/tickets/local-created-tickets': { saveLocalTicket: async () => { throw new Error('unexpected create') } },
    '@/lib/api/users': { getCurrentUser: async () => ({ id: 'u', name: 'User' }) },
  }
  const exports = {}
  new Function('require', 'exports', code)(name => modules[name], exports)
  return exports
}
const task = { id: 't1', displayId: '#1', projectId: 'p1', title: 'Task', status: 'todo', priority: 'none' }
const context = { projects: [{ id: 'p1', name: 'P', organizationName: 'O', members: [] }], members: [], tasks: [task] }
const block = value => '```quire-action\n' + JSON.stringify(value) + '\n```'

test('edits only accessible tasks and rejects unsupported fields', () => {
  const api = workflow(async () => { throw new Error('unexpected request') })
  const proposed = { type: 'edit_task', taskId: 't1', changes: { status: 'completed' } }
  assert.equal(api.parseReply(block(proposed), context).action.type, 'edit_task')
  assert.equal(api.parseReply(block({ ...proposed, taskId: 'private' }), context).action, undefined)
  assert.equal(api.parseReply(block({ ...proposed, changes: { projectId: 'private' } }), context).action, undefined)
})

test('rechecks access and previous values before sending only approved changes', async () => {
  const calls = []
  let current = task
  const api = workflow(async (url, init) => { calls.push({ url, init }); if (!init) return current; return {} })
  const proposal = api.parseReply(block({ type: 'edit_task', taskId: 't1', changes: { status: 'completed' } }), context).action
  assert.equal(calls.length, 0)
  current = { ...task, status: 'in-progress' }
  await assert.rejects(api.executeProposal(proposal, context), /task_changed/)
  assert.equal(calls.length, 1)
  current = task
  await api.executeProposal(proposal, context)
  assert.equal(calls[2].init.method, 'PATCH')
  assert.deepEqual(JSON.parse(calls[2].init.body), { status: 'completed' })
})

test('does not send an edit after access is revoked', async () => {
  const calls = []
  const api = workflow(async (url, init) => { calls.push({ url, init }); throw new Error('not found') })
  const proposal = api.parseReply(block({ type: 'edit_task', taskId: 't1', changes: { title: 'New' } }), context).action
  await assert.rejects(api.executeProposal(proposal, context), /not found/)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].init, undefined)
})

test('assignee changes accept only members of the task project', () => {
  const api = workflow(async () => { throw new Error('unexpected request') })
  const withMember = { ...context, projects: [{ ...context.projects[0], members: [{ id: 'member', name: 'Sara' }] }] }
  const proposal = { type: 'edit_task', taskId: 't1', changes: { assigneeIds: ['member'] } }
  assert.deepEqual(api.parseReply(block(proposal), withMember).action.changes.assigneeNames, ['Sara'])
  assert.equal(api.parseReply(block({ ...proposal, changes: { assigneeIds: ['outsider'] } }), withMember).action, undefined)
})
