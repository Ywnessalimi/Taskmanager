import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { once } from 'node:events'
import { openDatabase } from '../database.js'
import { hashPassword } from '../apps/auth/auth-repository.js'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

test('HTTP session, model loop, selective confirmation, download and real MCP transport', { timeout: 30000 }, async t => {
  const directory = mkdtempSync(join(tmpdir(), 'quire-ai-http-'))
  const databasePath = join(directory, 'test.sqlite')
  const database = openDatabase({ path: databasePath })
  const timestamp = new Date().toISOString()
  database.prepare('INSERT INTO users (id,name,email,password_hash,created_at) VALUES (?,?,?,?,?)').run('http-manager', 'مدیر آزمایش', 'manager@test.invalid', hashPassword('test-password-only'), timestamp)
  database.prepare('INSERT INTO users (id,name,email,password_hash,created_at) VALUES (?,?,?,?,?)').run('http-new', 'New member', 'new@test.invalid', hashPassword('test-password-only'), timestamp)
  database.prepare('INSERT INTO organization_members (id,organization_id,user_id,role,permissions,created_at) VALUES (?,?,?,?,?,?)').run('http-member', 'org-1', 'http-manager', 'owner', '{}', timestamp)
  database.prepare("INSERT INTO project_members (project_id,organization_member_id,created_at) SELECT id, 'http-member', ? FROM projects WHERE organization_id = 'org-1'").run(timestamp)
  database.prepare("INSERT INTO organization_members (id,organization_id,user_id,role,permissions,created_at) VALUES ('http-new-member','org-1','http-new','custom','{}',?)").run(timestamp)
  database.close()

  const provider = createServer(async (request, response) => {
    const chunks = []
    for await (const chunk of request) chunks.push(chunk)
    const body = JSON.parse(Buffer.concat(chunks).toString())
    assert.ok(body.messages[0].content.includes('registered skills'))
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({ choices: [{ message: { role: 'assistant', content: JSON.stringify({ reply: 'دو تسک پیشنهادی آماده است.', calls: [{ name: 'tasks_propose', arguments: { projectId: 'proj-1', summary: 'برنامهٔ آزمایشی', tasks: [{ title: 'Task A', assigneeIds: ['http-manager'] }, { title: 'Task B', assigneeIds: ['http-manager'] }] } }] }) } }] }))
  })
  provider.listen(0, '127.0.0.1')
  await once(provider, 'listening')
  const child = spawn(process.execPath, ['server.js'], {
    cwd: fileURLToPath(new URL('../', import.meta.url)), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
    env: { ...process.env, PORT: '0', HOST: '127.0.0.1', DATABASE_PATH: databasePath, SESSION_COOKIE_SECURE: 'false', FRONTEND_ORIGINS: 'http://localhost:3015', INITIAL_ADMIN_EMAIL: '', INITIAL_ADMIN_PASSWORD: '', AI_API_KEY: 'synthetic-test-only', AI_TOOL_MODE: 'json', AI_API_BASE_URL: 'http://127.0.0.1:' + provider.address().port },
  })
  const closed = once(child, 'exit')
  t.after(async () => {
    child.kill()
    await closed
    provider.closeAllConnections()
    await new Promise(resolve => provider.close(resolve))
    const target = resolve(directory)
    assert.equal(dirname(target), resolve(tmpdir()))
    assert.ok(basename(target).startsWith('quire-ai-http-'))
    rmSync(target, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
  })
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('API startup timed out')), 12000)
    child.once('error', reject)
    child.stdout.on('data', chunk => {
      const match = chunk.toString().match(/http:\/\/127\.0\.0\.1:(\d+)/)
      if (match) { clearTimeout(timer); resolve(Number(match[1])) }
    })
    child.stderr.on('data', chunk => { if (!chunk.toString().includes('ExperimentalWarning') && !chunk.toString().includes('trace-warnings')) reject(new Error(chunk.toString())) })
  })
  const base = 'http://127.0.0.1:' + port
  let cookie = ''
  async function request(path, body, expected = 200, extraHeaders = {}) {
    const response = await fetch(base + '/api/v1' + path, { method: body === undefined ? 'GET' : 'POST', headers: { 'content-type': 'application/json', cookie, ...extraHeaders }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    assert.equal(response.status, expected, await response.clone().text())
    return response
  }
  const login = await request('/auth/login', { email: 'manager@test.invalid', password: 'test-password-only' })
  cookie = login.headers.get('set-cookie').split(';')[0]
  const attachmentUrl = base + '/api/v1/assistant/attachments?name=note.txt'
  const unauthorizedAttachment = await fetch(attachmentUrl, { method: 'POST', body: 'test' })
  assert.equal(unauthorizedAttachment.status, 401)
  const forbiddenAttachment = await fetch(attachmentUrl, { method: 'POST', headers: { cookie, origin: 'https://untrusted.invalid' }, body: 'test' })
  assert.equal(forbiddenAttachment.status, 403)
  const attachment = await fetch(attachmentUrl, { method: 'POST', headers: { cookie }, body: 'sample document' })
  assert.equal(attachment.status, 200)
  assert.equal((await attachment.json()).text, 'sample document')
  await request('/assistant/tools/projects_list', {}, 403, { origin: 'https://untrusted.invalid' })
  const chat = await (await request('/assistant/chat', { messages: [{ role: 'user', content: 'Plan two tasks' }], locale: 'fa' })).json()
  assert.deepEqual(chat.usedSkills, ['tasks_propose'])
  const preview = chat.widgets[0]
  const selectedKeys = [preview.items[0].key]
  const first = await (await request('/assistant/previews/' + preview.id + '/confirm', { selectedKeys })).json()
  const retry = await (await request('/assistant/previews/' + preview.id + '/confirm', { selectedKeys })).json()
  assert.deepEqual(retry, first)
  assert.equal(first.items.length, 1)
  const activity = await fetch(base + '/api/v1/projects/proj-1/member-activity', { headers: { cookie } })
  assert.equal(activity.status, 200)
  const activityData = await activity.json()
  assert.equal(activityData.timeZone, 'UTC')
  assert.ok(activityData.counts.some(row => row.actorId === 'http-manager' && row.count === 1))
  assert.equal((await fetch(base + '/api/v1/projects/proj-1/member-activity')).status, 401)
  assert.equal((await fetch(base + '/api/v1/projects/nonexistent/member-activity', { headers: { cookie } })).status, 404)
  const history = await fetch(base + '/api/v1/projects/proj-1/status-history', { headers: { cookie } })
  assert.equal(history.status, 200)
  assert.equal((await history.json()).days.length, 12)
  assert.equal((await fetch(base + '/api/v1/projects/proj-1/status-history')).status, 401)
  const report = await (await request('/assistant/tools/report_tasks', { projectIds: ['proj-1'] })).json()
  const file = await request('/assistant/reports/' + report.reportId + '/export', { format: 'xlsx' })
  assert.ok(file.headers.get('content-type').includes('spreadsheet'))
  assert.equal(Buffer.from(await file.arrayBuffer()).subarray(0, 2).toString(), 'PK')

  const ticket = { title: 'Project ticket', subject: 'general', status: 'todo', projectId: 'proj-1', permissionIds: [] }
  const ticketResponse = await fetch(base + '/api/v1/tickets/private-ticket', { method: 'PUT', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ ticket }) })
  assert.equal(ticketResponse.status, 200)
  const secondLogin = await fetch(base + '/api/v1/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'new@test.invalid', password: 'test-password-only' }) })
  const secondCookie = secondLogin.headers.get('set-cookie').split(';')[0]
  assert.equal((await fetch(base + '/api/v1/projects/proj-1', { headers: { cookie: secondCookie } })).status, 404)
  assert.equal((await fetch(base + '/api/v1/projects/proj-1/tasks', { headers: { cookie: secondCookie } })).status, 404)
  assert.equal((await fetch(base + '/api/v1/projects/proj-1/status-history', { headers: { cookie: secondCookie } })).status, 404)
  assert.equal((await fetch(base + '/api/v1/tickets/private-ticket', { headers: { cookie: secondCookie } })).status, 404)
  assert.equal((await fetch(base + '/api/v1/tickets/private-ticket/comments', { headers: { cookie: secondCookie } })).status, 404)
  assert.ok(!(await (await fetch(base + '/api/v1/tickets', { headers: { cookie: secondCookie } })).json()).some(item => item.id === 'private-ticket'))
  assert.ok(!(await (await fetch(base + '/api/v1/organizations/org-1/activity', { headers: { cookie: secondCookie } })).json()).some(item => item.taskId === first.items[0].id))
  await request('/projects/proj-1/members', { userId: 'not-a-member' }, 400)
  await request('/projects/proj-1/members', { userId: 'http-new' }, 201)
  await request('/projects/proj-1/members', { userId: 'http-new' }, 409)
  assert.equal((await fetch(base + '/api/v1/projects/proj-1', { headers: { cookie: secondCookie } })).status, 200)
  assert.equal((await fetch(base + '/api/v1/tickets/private-ticket', { headers: { cookie: secondCookie } })).status, 200)

  const issued = await (await request('/integrations/tokens', { name: 'HTTP test', projectIds: ['proj-1'], scopes: ['read', 'create', 'update_status'] }, 201)).json()
  const client = new Client({ name: 'quire-integration-test', version: '1.0.0' })
  await client.connect(new StreamableHTTPClientTransport(new URL(base + '/api/v1/mcp'), { requestInit: { headers: { authorization: 'Bearer ' + issued.token } } }))
  t.after(() => client.close())
  const catalog = await client.listTools()
  assert.equal(catalog.tools.length, 5)
  const call = (name, args) => client.callTool({ name, arguments: args })
  const created = await call('tasks_create', { requestId: 'http-create-1', projectId: 'proj-1', title: 'MCP task' })
  assert.ok(!created.isError, JSON.stringify(created))
  const task = JSON.parse(created.content[0].text)
  const repeated = await call('tasks_create', { requestId: 'http-create-1', projectId: 'proj-1', title: 'MCP task' })
  assert.equal(JSON.parse(repeated.content[0].text).id, task.id)
  const updated = await call('tasks_update_status', { requestId: 'http-update-1', taskId: task.id, status: 'completed' })
  assert.equal(JSON.parse(updated.content[0].text).status, 'completed')
  const denied = await call('tasks_create', { requestId: 'http-create-2', projectId: 'proj-2', title: 'Forbidden' })
  assert.equal(denied.isError, true)
  await fetch(base + '/api/v1/integrations/tokens/' + issued.id, { method: 'DELETE', headers: { cookie } })
  await assert.rejects(() => call('projects_list', {}))
  await client.close()
})
