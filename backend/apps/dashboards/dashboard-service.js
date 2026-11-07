import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { DomainError } from '../tasks/task-service.js'

const slotSchema = z.object({ id: z.string().min(1).max(100), widget: z.enum(['tickets', 'tasks', 'notifications', 'task-status-chart', 'task-status-donut']).nullable() }).strict()
export const dashboardProposalSchema = z.object({
  name: z.string().trim().min(1).max(120),
  projectIds: z.array(z.string().min(1)).min(1).max(30),
  assigneeIds: z.array(z.string().min(1)).max(30).default([]),
  widgets: z.array(z.enum(['tasks', 'task-status-chart', 'task-status-donut'])).min(1).max(12),
}).strict()
const parse = row => ({ id: row.id, name: row.name, slots: JSON.parse(row.slots), filters: JSON.parse(row.filters), version: row.version, remote: true })

export function createDashboardService({ database, taskService, repository }) {
  function get(user, id) {
    const row = database.prepare('SELECT * FROM user_dashboards WHERE id = ? AND user_id = ?').get(id, user.id)
    if (!row) throw new DomainError(404, 'dashboard_not_found', 'کارتابل پیدا نشد.')
    return parse(row)
  }
  function validate(user, raw) {
    const parsed = dashboardProposalSchema.safeParse(raw)
    if (!parsed.success) throw new DomainError(400, 'invalid_dashboard', 'تعریف کارتابل معتبر نیست.')
    const input = parsed.data
    const members = input.projectIds.flatMap(id => taskService.projectFor(user, id).memberIds)
    if (input.assigneeIds.some(id => !members.includes(id))) throw new DomainError(400, 'invalid_members', 'عضو انتخاب‌شده در پروژه‌ها پیدا نشد.')
    return input
  }
  return {
    validate,
    list(user) { return database.prepare('SELECT * FROM user_dashboards WHERE user_id = ? ORDER BY created_at, id').all(user.id).map(parse) },
    create(user, raw) {
      const input = validate(user, raw)
      if (database.prepare('SELECT count(*) AS n FROM user_dashboards WHERE user_id = ?').get(user.id).n >= 30) throw new DomainError(400, 'dashboard_limit', 'سقف تعداد کارتابل‌ها ۳۰ است.')
      const id = randomUUID()
      const slots = input.widgets.map(widget => ({ id: randomUUID(), widget }))
      database.prepare('INSERT INTO user_dashboards (id,user_id,name,slots,filters,created_at) VALUES (?,?,?,?,?,?)').run(id, user.id, input.name, JSON.stringify(slots), JSON.stringify({ projectIds: input.projectIds, assigneeIds: input.assigneeIds }), new Date().toISOString())
      return get(user, id)
    },
    update(user, id, raw) {
      const input = z.object({ version: z.number().int().positive(), slots: z.array(slotSchema).max(20) }).strict().safeParse(raw)
      if (!input.success) throw new DomainError(400, 'invalid_dashboard', 'تعریف ویجت‌ها معتبر نیست.')
      get(user, id)
      const result = database.prepare('UPDATE user_dashboards SET slots = ?, version = version + 1 WHERE id = ? AND user_id = ? AND version = ?').run(JSON.stringify(input.data.slots), id, user.id, input.data.version)
      if (!result.changes) throw new DomainError(409, 'dashboard_changed', 'کارتابل تغییر کرده است. صفحه را تازه کنید.')
      return get(user, id)
    },
    remove(user, id) { database.prepare('DELETE FROM user_dashboards WHERE id = ? AND user_id = ?').run(id, user.id) },
    tasks(user, id) {
      const dashboard = get(user, id)
      const projects = dashboard.filters.projectIds.map(id => taskService.projectFor(user, id))
      const tasks = repository.listTasks({ projectIds: projects.map(project => project.id) })
      return tasks.filter(task => !dashboard.filters.assigneeIds.length || task.assigneeIds.some(id => dashboard.filters.assigneeIds.includes(id))).map(task => ({ ...task, projectName: projects.find(project => project.id === task.projectId).name }))
    },
  }
}
