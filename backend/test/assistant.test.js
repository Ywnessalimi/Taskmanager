import test from 'node:test'
import assert from 'node:assert/strict'
import { openDatabase } from '../database.js'
import { createTaskRepository } from '../task-repository.js'
import { createOrganizationRepository } from '../apps/organizations/organization-repository.js'
import { createOrganizationActivityRepository } from '../apps/organizations/organization-activity-repository.js'
import { createNotificationRepository } from '../apps/notifications/notification-repository.js'
import { createTicketRepository } from '../apps/tickets/ticket-repository.js'
import { createTicketCommentRepository } from '../apps/tickets/ticket-comment-repository.js'
import { createAuthRepository } from '../apps/auth/auth-repository.js'
import { createTaskService, validateTaskInput } from '../apps/tasks/task-service.js'
import { createAssistantStore } from '../apps/ai/assistant-store.js'
import { createAgentService } from '../apps/ai/agent-service.js'
import { createAIService } from '../apps/ai/ai-service.js'
import { createIntegrationService } from '../apps/integrations/integration-service.js'
import { exportReport } from '../apps/ai/report-export.js'
import ExcelJS from 'exceljs'
import { createDashboardService } from '../apps/dashboards/dashboard-service.js'

function fixture(t) {
  const database = openDatabase({ path: ':memory:' })
  t.after(() => database.close())
  const authRepository = createAuthRepository(database)
  const timestamp = new Date().toISOString()
  for (const [id, name] of [['manager', 'مدیر'], ['ali', 'علی'], ['outsider', 'کاربر دیگر']]) {
    database.prepare('INSERT INTO users (id,name,email,password_hash,created_at) VALUES (?,?,?,?,?)').run(id, name, `${id}@test.invalid`, 'unused', timestamp)
  }
  for (const id of ['manager', 'ali']) database.prepare('INSERT INTO organization_members (id, organization_id, user_id, role, permissions, created_at) VALUES (?,?,?,?,?,?)').run(`member-${id}`, 'org-1', id, id === 'manager' ? 'owner' : 'custom', '{}', timestamp)
  database.prepare("INSERT INTO project_members (project_id, organization_member_id, created_at) SELECT p.id, m.id, ? FROM projects p JOIN organization_members m ON m.organization_id = p.organization_id").run(timestamp)
  const repository = createTaskRepository(database)
  const organizationRepository = createOrganizationRepository(database)
  const notificationRepository = createNotificationRepository(database)
  const organizationActivityRepository = createOrganizationActivityRepository(database)
  const taskService = createTaskService({ database, repository, organizationRepository, notificationRepository, organizationActivityRepository, validateTaskInput })
  const store = createAssistantStore(database)
  const dashboardService = createDashboardService({ database, repository, taskService })
  const agent = createAgentService({ database, repository, organizationRepository, notificationRepository, taskService, dashboardService, store, ticketRepository: createTicketRepository(database), ticketCommentRepository: createTicketCommentRepository(database) })
  const integration = createIntegrationService({ database, authRepository, organizationRepository, repository, taskService, store })
  return { database, repository, taskService, organizationActivityRepository, store, agent, integration, dashboardService, user: authRepository.getUser('manager'), outsider: authRepository.getUser('outsider'), ali: authRepository.getUser('ali') }
}

function propose(context, titles = ['یک', 'دو']) {
  return context.agent.run(context.user, 'tasks_propose', { projectId: 'proj-1', summary: 'برنامهٔ پروژه', tasks: titles.map(title => ({ title, assigneeIds: ['ali'] })) }).widget
}

test('project daily activity counts only recorded task events in that project by actor', t => {
  const context = fixture(t)
  const task = context.taskService.create(context.user, { projectId: 'proj-1', title: 'First' })
  context.taskService.update(context.ali, task.id, { status: 'in-progress' })
  context.taskService.create(context.user, { projectId: 'proj-2', title: 'Other project' })
  context.organizationActivityRepository.create('org-1', context.user, 'comment', { text: 'Organization comment' })
  const counts = context.organizationActivityRepository.projectDailyCounts('proj-1', 'org-1', '2000-01-01T00:00:00.000Z', '2100-01-01T00:00:00.000Z')
  assert.deepEqual(counts.map(row => ({ actorId: row.actorId, count: row.count })), [{ actorId: 'ali', count: 1 }, { actorId: 'manager', count: 1 }])
  assert.equal(counts[0].day, new Date().toISOString().slice(0, 10))
  assert.deepEqual(context.organizationActivityRepository.projectDailyCounts('proj-1', 'org-1', '2000-01-01T00:00:00.000Z', '2001-01-01T00:00:00.000Z'), [])
})

test('project membership restricts access and only permitted project members can add organization members', t => {
  const context = fixture(t)
  const now = new Date().toISOString()
  context.database.prepare('INSERT INTO users (id,name,email,password_hash,created_at) VALUES (?,?,?,?,?)').run('new-user', 'New user', 'new@test.invalid', 'unused', now)
  context.database.prepare("INSERT INTO organization_members (id,organization_id,user_id,role,permissions,created_at) VALUES (?,?,?,'custom','{}',?)").run('new-member', 'org-1', 'new-user', now)
  const orgs = createOrganizationRepository(context.database)
  assert.equal(orgs.canAccessProject('new-user', 'proj-1'), false)
  assert.equal(orgs.getProject('proj-1', 'new-user'), undefined)
  assert.deepEqual(orgs.addProjectMember('ali', 'proj-1', 'new-user'), { forbidden: true })
  assert.deepEqual(orgs.addProjectMember('manager', 'proj-1', 'outsider'), { invalidMember: true })
  assert.deepEqual(orgs.addProjectMember('manager', 'proj-1', 'new-user'), { added: true })
  assert.deepEqual(orgs.addProjectMember('manager', 'proj-1', 'new-user'), { alreadyMember: true })
  assert.equal(orgs.canAccessProject('new-user', 'proj-1'), true)
  assert.equal(orgs.canAccessProject('new-user', 'proj-2'), false)
  const division = context.database.prepare("SELECT division_id FROM projects WHERE id = 'proj-1'").get().division_id
  const created = orgs.createProject('manager', division, 'New project')
  assert.deepEqual(created.memberIds, ['manager'])
  assert.equal(orgs.canAccessProject('ali', created.id), false)
})

test('moving projects to another organization keeps only shared members', t => {
  const context = fixture(t)
  const orgs = createOrganizationRepository(context.database)
  const target = orgs.createOrganization('manager', 'Target organization')
  const division = orgs.createDivision('manager', target.id, 'Target division')
  const moved = orgs.moveProject('manager', 'proj-1', division.id)
  assert.equal(moved.organizationId, target.id)
  assert.deepEqual(moved.memberIds, ['manager'])
  assert.equal(orgs.canAccessProject('ali', 'proj-1'), false)
  assert.equal(orgs.canAccessProject('manager', 'proj-1'), true)
})

test('moving a division keeps each project membership within the target organization', t => {
  const context = fixture(t)
  const orgs = createOrganizationRepository(context.database)
  const target = orgs.createOrganization('manager', 'Other organization')
  const divisionId = context.database.prepare("SELECT division_id FROM projects WHERE id = 'proj-1'").get().division_id
  const result = orgs.moveDivision('manager', 'org-1', divisionId, target.id)
  assert.equal(result.organizationId, target.id)
  const moved = orgs.getProject('proj-1', 'manager')
  assert.deepEqual(moved.memberIds, ['manager'])
  assert.equal(orgs.canAccessProject('ali', 'proj-1'), false)
})

test('only selected cards are created, retries reuse IDs and notification, selection is immutable', t => {
  const context = fixture(t)
  const preview = propose(context)
  const count = context.repository.listTasks().length
  assert.equal(context.repository.listTasks().length, count)
  const selected = [preview.items[1].key]
  const first = context.agent.confirm(context.user, preview.id, selected)
  assert.equal(context.repository.listTasks().length, count + 1)
  assert.deepEqual(context.repository.getTask(first.items[0].id).assigneeIds, ['ali'])
  assert.equal(context.database.prepare('SELECT count(*) AS n FROM notifications').get().n, 1)
  assert.deepEqual(context.agent.confirm(context.user, preview.id, selected), first)
  assert.equal(context.database.prepare('SELECT count(*) AS n FROM notifications').get().n, 1)
  assert.throws(() => context.agent.confirm(context.user, preview.id, [preview.items[0].key]), { code: 'selection_changed' })
})

test('preview ownership, expiration, cancellation and current membership are enforced', t => {
  const context = fixture(t)
  const preview = propose(context)
  assert.throws(() => context.agent.confirm(context.outsider, preview.id, [preview.items[0].key]), { code: 'preview_not_found' })
  assert.throws(() => context.agent.confirm(context.user, preview.id, ['fake']), { code: 'invalid_selection' })
  context.database.prepare('DELETE FROM organization_members WHERE user_id = ?').run('ali')
  assert.throws(() => context.agent.confirm(context.user, preview.id, [preview.items[0].key]), { code: 'invalid_assignees' })
  context.store.cancel(context.user.id, preview.id)
  assert.throws(() => context.agent.confirm(context.user, preview.id, [preview.items[0].key]), { code: 'preview_expired' })
})

test('a failure midway rolls back the entire batch, including sequence, events and notifications', t => {
  const context = fixture(t)
  const preview = propose(context, ['first', 'fail'])
  const count = context.repository.listTasks().length
  const sequence = context.database.prepare('SELECT last_value FROM task_display_sequence').get().last_value
  context.database.exec("CREATE TRIGGER fail_second BEFORE INSERT ON tasks WHEN NEW.title = 'fail' BEGIN SELECT RAISE(ABORT, 'simulated failure'); END")
  assert.throws(() => context.agent.confirm(context.user, preview.id, preview.items.map(item => item.key)))
  assert.equal(context.repository.listTasks().length, count)
  assert.equal(context.database.prepare('SELECT last_value FROM task_display_sequence').get().last_value, sequence)
  assert.equal(context.database.prepare('SELECT count(*) AS n FROM notifications').get().n, 0)
  assert.equal(context.database.prepare('SELECT state FROM assistant_previews WHERE id = ?').get(preview.id).state, 'pending')
})

test('edits require a fresh preview if task data changes', t => {
  const context = fixture(t)
  const task = context.taskService.create(context.user, { projectId: 'proj-1', title: 'Original' })
  const { widget } = context.agent.run(context.user, 'tasks_propose_update', { changes: [{ taskId: task.id, patch: { title: 'Proposed' } }] })
  context.taskService.update(context.user, task.id, { title: 'Changed elsewhere' })
  assert.throws(() => context.agent.confirm(context.user, widget.id, [widget.items[0].key]), { code: 'stale_preview' })
  assert.equal(context.repository.getTask(task.id).title, 'Changed elsewhere')
})

test('reports are owned snapshots and downloads recheck access', async t => {
  const context = fixture(t)
  const { widget } = context.agent.run(context.user, 'report_tasks', { projectIds: ['proj-1'], title: 'گزارش تیم' })
  const report = widget.report
  context.taskService.create(context.user, { projectId: 'proj-1', title: 'Later' })
  assert.equal(context.agent.reportFor(context.user, report.id).rows.length, report.rows.length)
  assert.throws(() => context.agent.reportFor(context.outsider, report.id), { code: 'report_not_found' })
  context.database.prepare('DELETE FROM organization_members WHERE user_id = ?').run(context.user.id)
  assert.throws(() => context.agent.reportFor(context.user, report.id), { code: 'project_not_found' })
})

test('XLSX, Word and PDF exports are real files and CSV neutralizes formulas', async t => {
  const context = fixture(t)
  context.taskService.create(context.user, { projectId: 'proj-1', title: '=HYPERLINK("bad")', assigneeIds: ['ali'] })
  const report = context.agent.run(context.user, 'report_tasks', { projectIds: ['proj-1'] }).widget.report
  const xlsx = await exportReport(report, { format: 'xlsx', columns: ['title', 'status'] })
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(xlsx.buffer)
  assert.equal(workbook.worksheets[1].rowCount, report.rows.length + 1)
  assert.equal(workbook.worksheets[1].getRow(1).getCell(1).value, 'عنوان')
  assert.equal(workbook.worksheets[1].lastRow.getCell(1).type, ExcelJS.ValueType.String)
  const csv = await exportReport(report, { format: 'csv', columns: ['title'] })
  assert.match(csv.buffer.toString(), /'=HYPERLINK/)
  const docx = await exportReport(report, { format: 'docx' })
  assert.equal(docx.buffer.subarray(0, 2).toString(), 'PK')
  const pdf = await exportReport(report, { format: 'pdf' })
  assert.equal(pdf.buffer.subarray(0, 5).toString(), '%PDF-')
})

test('developer tokens enforce scopes, membership, own-task status and idempotency', t => {
  const context = fixture(t)
  const { token, id } = context.integration.issue(context.ali, { name: 'IDE', projectIds: ['proj-1'], scopes: ['read', 'create', 'update_status'] })
  const args = { requestId: 'request-001', projectId: 'proj-1', title: 'From IDE' }
  const task = context.integration.invoke(token, 'tasks_create', args)
  assert.deepEqual(context.integration.invoke(token, 'tasks_create', args), JSON.parse(JSON.stringify(task)))
  assert.throws(() => context.integration.invoke(token, 'tasks_create', { ...args, title: 'Different' }), { code: 'request_conflict' })
  context.integration.invoke(token, 'tasks_update_status', { requestId: 'request-002', taskId: task.id, status: 'completed' })
  assert.equal(context.repository.getTask(task.id).status, 'completed')
  const other = context.taskService.create(context.user, { projectId: 'proj-1', title: 'Managers task', assigneeIds: ['manager'] })
  assert.throws(() => context.integration.invoke(token, 'tasks_update_status', { requestId: 'request-003', taskId: other.id, status: 'completed' }), { code: 'not_assigned' })
  assert.throws(() => context.integration.invoke(token, 'tasks_list_mine', { projectId: 'proj-2' }), { code: 'project_scope' })
  context.integration.revoke(context.ali, id)
  assert.throws(() => context.integration.invoke(token, 'projects_list', {}), { code: 'invalid_token' })
})

test('native function calling and JSON mode dispatch validated skills without executing previews', async t => {
  for (const toolMode of ['json', 'native']) {
    const context = fixture(t)
    const args = { projectId: 'proj-1', summary: 'Plan', tasks: [{ title: 'Draft task' }] }
    let request
    const service = createAIService({ apiKey: 'test-key', toolMode, fetchImpl: async (url, init) => {
      request = JSON.parse(init.body)
      const message = toolMode === 'json'
        ? { content: JSON.stringify({ reply: 'پیش‌نویس آماده است.', calls: [{ name: 'tasks_propose', arguments: args }] }) }
        : { content: 'پیش‌نویس آماده است.', tool_calls: [{ id: 'call-1', type: 'function', function: { name: 'tasks_propose', arguments: JSON.stringify(args) } }] }
      return { ok: true, json: async () => ({ choices: [{ message }] }) }
    } })
    const count = context.repository.listTasks().length
    const result = await service.reply([{ role: 'user', content: 'Plan a task' }], { user: context.user, agent: context.agent })
    assert.equal(result.widgets[0].type, 'preview')
    assert.equal(context.repository.listTasks().length, count)
    assert.equal(Boolean(request.tools), toolMode === 'native')
  }
})

test('invalid model JSON is retried without executing incomplete calls', async t => {
  const context = fixture(t)
  const answers = ['{"reply":"unfinished","calls":[', JSON.stringify({ reply: 'گزارش آماده است', calls: [{ name: 'report_tasks', arguments: { projectIds: ['proj-1'] } }] }), JSON.stringify({ reply: 'گزارش آماده است', calls: [] })]
  const requests = []
  const service = createAIService({ apiKey: 'test', fetchImpl: async (url, init) => {
    requests.push(JSON.parse(init.body))
    return { ok: true, json: async () => ({ choices: [{ message: { content: answers.shift() } }] }) }
  } })
  const result = await service.reply([{ role: 'user', content: 'Excel report' }], { user: context.user, agent: context.agent })
  assert.equal(requests.length, 3)
  assert.deepEqual(result.usedSkills, ['report_tasks'])
  assert.equal(result.widgets[0].type, 'report')
})

test('native tool calls support task proposals after a report conversation', async t => {
  const context = fixture(t)
  const args = { projectId: 'proj-1', summary: 'تسک تازه', tasks: [{ title: 'مرور قرارداد', assigneeIds: ['manager'] }] }
  const requests = []
  const responses = [
    { content: '', tool_calls: [{ id: 'projects-call', type: 'function', function: { name: 'projects_list', arguments: '{}' } }] },
    { content: '', tool_calls: [{ id: 'proposal-call', type: 'function', function: { name: 'tasks_propose', arguments: JSON.stringify(args) } }] },
  ]
  const service = createAIService({ apiKey: 'test', toolMode: 'native', fetchImpl: async (url, init) => {
    requests.push(JSON.parse(init.body))
    return { ok: true, json: async () => ({ choices: [{ message: responses.shift() }] }) }
  } })
  const count = context.repository.listTasks().length
  const result = await service.reply([
    { role: 'user', content: 'گزارش اکسل بده' },
    { role: 'assistant', content: 'گزارش آماده است.\nReport ID test-report' },
    { role: 'user', content: 'برای خودم تسک مرور قرارداد بساز' },
  ], { user: context.user, agent: context.agent })
  assert.deepEqual(result.usedSkills, ['projects_list', 'tasks_propose'])
  assert.equal(result.widgets[0].type, 'preview')
  assert.equal(context.repository.listTasks().length, count)
  assert.equal(requests[1].messages.at(-1).role, 'tool')
  assert.equal(requests[1].messages.at(-1).tool_call_id, 'projects-call')
})

test('a prepared report remains downloadable when both model responses are invalid', async t => {
  const context = fixture(t)
  const answers = [JSON.stringify({ reply: '', calls: [{ name: 'report_tasks', arguments: { projectIds: ['proj-1'] } }] }), '{', '{']
  const service = createAIService({ apiKey: 'test', fetchImpl: async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: answers.shift() } }] }) }) })
  const result = await service.reply([{ role: 'user', content: 'Excel report' }], { user: context.user, agent: context.agent })
  assert.equal(result.widgets[0].type, 'report')
  const report = context.agent.reportFor(context.user, result.widgets[0].report.id)
  const file = await exportReport(report, { format: 'xlsx' })
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(file.buffer)
  assert.ok(workbook.worksheets.length)
})

test('invalid responses without a report still return an error', async () => {
  let calls = 0
  const service = createAIService({ apiKey: 'test', fetchImpl: async () => { calls++; return { ok: true, json: async () => ({ choices: [{ message: { content: '{' } }] }) } } })
  await assert.rejects(service.reply([{ role: 'user', content: 'Hi' }], { user: {}, agent: {} }), { code: 'invalid_model_response' })
  assert.equal(calls, 2)
})

test('selected dashboards persist, filter the team and reject stale layouts and access loss', t => {
  const context = fixture(t)
  context.taskService.create(context.user, { projectId: 'proj-1', title: 'Ali task', assigneeIds: ['ali'] })
  const { widget } = context.agent.run(context.user, 'dashboards_propose', { dashboards: [
    { name: 'مدیریت حسابداری', projectIds: ['proj-1'], assigneeIds: ['ali'], widgets: ['tasks'] },
    { name: 'گزارش حسابداری', projectIds: ['proj-1'], widgets: ['task-status-chart'] },
  ] })
  context.agent.confirm(context.user, widget.id, [widget.items[0].key])
  const dashboards = context.dashboardService.list(context.user)
  assert.equal(dashboards.length, 1)
  assert.equal(context.dashboardService.list(context.outsider).length, 0)
  const dashboard = dashboards[0]
  assert.equal(context.dashboardService.tasks(context.user, dashboard.id).length, 1)
  context.dashboardService.update(context.user, dashboard.id, { version: 1, slots: [] })
  assert.throws(() => context.dashboardService.update(context.user, dashboard.id, { version: 1, slots: [] }), { code: 'dashboard_changed' })
  context.database.prepare('DELETE FROM organization_members WHERE user_id = ?').run(context.user.id)
  assert.throws(() => context.dashboardService.tasks(context.user, dashboard.id), { code: 'project_not_found' })
})
