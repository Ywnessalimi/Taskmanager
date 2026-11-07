import { createHash, randomUUID } from 'node:crypto'
import { skillMap } from './skills/registry.js'
import { DomainError } from '../tasks/task-service.js'

const fingerprint = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')

export function createAgentService({ database, repository, organizationRepository, notificationRepository, ticketRepository, ticketCommentRepository, taskService, dashboardService, store }) {
  function projects(user) { return organizationRepository.listProjects(user.id) }
  function tasksFor(user, args = {}) {
    const accessible = projects(user)
    const ids = args.projectIds ?? (args.projectId ? [args.projectId] : accessible.map(project => project.id))
    for (const id of ids) taskService.projectFor(user, id)
    let tasks = repository.listTasks({ projectIds: ids })
    if (args.assigneeId) {
      const members = accessible.filter(project => ids.includes(project.id)).flatMap(project => project.members)
      const member = members.find(member => member.id === args.assigneeId)
      if (!member) throw new DomainError(404, 'member_not_found', 'عضو در این محدوده پیدا نشد.')
      tasks = tasks.filter(task => {
        if (task.assigneeIds.length) return task.assigneeIds.includes(member.id)
        const project = accessible.find(project => project.id === task.projectId)
        const matches = project.members.filter(person => person.name === member.name)
        if (task.assigneeNames.includes(member.name) && matches.length !== 1) throw new DomainError(409, 'ambiguous_assignee', 'مسئولان قدیمی هم‌نام‌اند. ابتدا مسئول تسک‌ها را مشخص کنید.')
        return task.assigneeNames.includes(member.name)
      })
    }
    if (args.status) tasks = tasks.filter(task => task.status === args.status)
    if (args.query) tasks = tasks.filter(task => `${task.title} ${task.displayId} ${task.description ?? ''}`.toLocaleLowerCase().includes(args.query.toLocaleLowerCase()))
    return { tasks, accessible, ids }
  }

  function taskView(task) {
    return { id: task.id, displayId: task.displayId, projectId: task.projectId, title: task.title, status: task.status, priority: task.priority, dueDate: task.dueDate, assigneeIds: task.assigneeIds, assigneeNames: task.assigneeNames, description: task.description?.slice(0, 3000) }
  }
  function ticketProject(user, input) {
    const project = input.projectId ? taskService.projectFor(user, input.projectId) : undefined
    const member = project?.members.find(member => member.id === input.assigneeId)
    if (input.assigneeId && !member) throw new DomainError(400, 'invalid_assignee', 'برای ارجاع تیکت، عضو پروژه را انتخاب کنید.')
    return { project, member }
  }
  function divisionFor(user, id) {
    for (const organization of organizationRepository.listOrganizations(user.id)) {
      const division = organization.divisions.find(division => division.id === id)
      if (division) {
        if (!organizationRepository.hasPermission(user.id, organization.id, 'createProject')) throw new DomainError(403, 'forbidden', 'مجوز ساخت پروژه ندارید.')
        return division
      }
    }
    throw new DomainError(404, 'division_not_found', 'معاونت پیدا نشد.')
  }
  function reportFor(user, id) {
    const report = store.getReport(user.id, id)
    for (const projectId of report.projectIds) taskService.projectFor(user, projectId)
    return report
  }

  const handlers = {
    dashboards_propose(user, args) {
      const items = args.dashboards.map(input => {
        dashboardService.validate(user, input)
        return { title: input.name, projectName: input.projectIds.map(id => taskService.projectFor(user, id).name).join('، '), input, reason: `${input.widgets.join(' · ')} — ${input.assigneeIds.map(id => projects(user).flatMap(project => project.members).find(member => member.id === id)?.name ?? id).join('، ')}` }
      })
      return { widget: store.prepare(user.id, 'dashboards_create', items) }
    },
    projects_list(user) {
      return { projects: projects(user).map(project => ({ id: project.id, name: project.name, organizationId: project.organizationId, divisionId: project.divisionId })), organizations: organizationRepository.listOrganizations(user.id).map(org => ({ id: org.id, name: org.name, divisions: org.divisions.map(division => ({ id: division.id, name: division.name })) })) }
    },
    members_list(user, args) {
      const project = taskService.projectFor(user, args.projectId)
      const tasks = repository.listTasks({ projectId: project.id })
      return { projectId: project.id, members: project.members.map(member => ({ id: member.id, name: member.name, jobTitle: member.jobTitle, skills: member.skills, bio: member.bio, openTasks: tasks.filter(task => task.status !== 'completed' && task.assigneeIds.includes(member.id)).length })), limitation: 'Open task count is not individual capacity. Legacy tasks without resolved assignee IDs are excluded from this count.' }
    },
    tasks_search(user, args) {
      const { tasks } = tasksFor(user, args)
      return { total: tasks.length, offset: args.offset, tasks: tasks.slice(args.offset, args.offset + 40).map(taskView) }
    },
    ask_question(user, args) { return { widget: { type: 'question', ...args } } },
    tasks_propose(user, args) {
      const project = taskService.projectFor(user, args.projectId)
      const items = args.tasks.map(task => {
        const input = taskService.validate(user, { ...task, projectId: project.id })
        input.subtasks = task.subtasks.map(subtask => taskService.validate(user, { ...subtask, projectId: project.id }))
        return { title: input.title, projectName: project.name, input, reason: task.reason ?? '' }
      })
      return { widget: store.prepare(user.id, 'tasks_create', items, args.summary) }
    },
    tasks_propose_update(user, args) {
      if (new Set(args.changes.map(change => change.taskId)).size !== args.changes.length) throw new DomainError(400, 'duplicate_task', 'هر تسک باید یک بار در پیش‌نویس باشد.')
      const items = args.changes.map(change => {
        const task = taskService.get(user, change.taskId)
        if (change.patch.assigneeIds) taskService.validate(user, { projectId: task.projectId, title: task.title, assigneeIds: change.patch.assigneeIds })
        return { title: task.title, projectName: taskService.projectFor(user, task.projectId).name, taskId: task.id, original: taskView(task), fingerprint: fingerprint(task), patch: change.patch, assigneeNames: change.patch.assigneeIds?.map(id => taskService.projectFor(user, task.projectId).members.find(member => member.id === id).name) }
      })
      return { widget: store.prepare(user.id, 'tasks_update', items) }
    },
    ticket_propose(user, args) {
      const { project, member } = ticketProject(user, args)
      return { widget: store.prepare(user.id, 'ticket_create', [{ title: args.title, projectName: project?.name ?? '', input: args, assigneeNames: member ? [member.name] : [] }]) }
    },
    project_propose(user, args) {
      const division = divisionFor(user, args.divisionId)
      return { widget: store.prepare(user.id, 'project_create', [{ title: args.name, projectName: division.name, input: args }]) }
    },
    report_tasks(user, args) {
      if (args.from && args.to && args.from >= args.to) throw new DomainError(400, 'invalid_period', 'شروع بازه باید قبل از پایان باشد.')
      const source = tasksFor(user, args)
      let tasks = source.tasks
      if (args.from) tasks = tasks.filter(task => task.createdAt >= args.from)
      if (args.to) tasks = tasks.filter(task => task.createdAt < args.to)
      if (tasks.length > 1000) throw new DomainError(400, 'report_too_large', 'محدودهٔ گزارش را به حداکثر ۱۰۰۰ تسک محدود کنید.')
      const rows = tasks.map(task => ({ ...taskView(task), project: source.accessible.find(project => project.id === task.projectId).name, assignees: task.assigneeNames.join('، '), createdAt: task.createdAt, timeSpentMinutes: task.timeSpentMinutes }))
      const summary = { total: rows.length, todo: 0, inProgress: 0, completed: 0 }
      for (const row of rows) summary[{ todo: 'todo', 'in-progress': 'inProgress', completed: 'completed' }[row.status]]++
      const limitations = ['وضعیت فعلی تسک‌های اصلی گزارش شده است. زیرتسک‌ها در شمارش مستقل نیستند.', 'زمان ثبت‌شده مشترکِ تسک است و به فرد یا بازهٔ زمانی نسبت داده نمی‌شود.']
      if (args.from || args.to) limitations.push('بازه روی زمان ساخت تسک اعمال شده است. وضعیت نمایش‌داده‌شده وضعیت فعلی است.')
      if (tasks.some(task => !task.assigneeIds.length && task.assigneeNames.length)) limitations.push('برخی مسئولان قدیمی فقط با نام ثبت شده‌اند.')
      const report = store.saveReport(user.id, { title: args.title, projectIds: source.ids, filters: args, rows, summary, limitations })
      return { widget: { type: 'report', report }, reportId: report.id, summary, limitations }
    },
    report_export(user, args) {
      reportFor(user, args.reportId)
      return { widget: { type: 'file', ...args } }
    },
    notifications_read(user, args) {
      const visible = notificationRepository.listForRecipient(user.name, user.id).filter(notification => {
        if (args.unreadOnly && notification.status !== 'unread') return false
        if (notification.target.projectId) return organizationRepository.canAccessProject(user.id, notification.target.projectId)
        const ticket = notification.target.type === 'ticket' ? ticketRepository.get(notification.target.id) : undefined
        return ticket && (ticket.createdById === user.id || ticket.assigneeId === user.id)
      })
      return { total: visible.length, notifications: visible.slice(args.offset, args.offset + 50).map(item => ({ id: item.id, event: item.verb, title: item.target.label, at: item.createdAt, href: item.target.type === 'task' ? `/tasks/${encodeURIComponent(item.target.id)}` : `/inbox/${encodeURIComponent(item.target.id)}` })) }
    },
    comments_search(user, args) {
      const allowed = projects(user).map(project => project.id)
      if (args.projectId) taskService.projectFor(user, args.projectId)
      const comments = ticketRepository.list().filter(ticket => allowed.includes(ticket.projectId) && (!args.projectId || args.projectId === ticket.projectId)).flatMap(ticket => ticketCommentRepository.list(ticket.id).filter(comment => comment.authorId === args.authorId && comment.text.toLocaleLowerCase().includes(args.query.toLocaleLowerCase())).map(comment => ({ ...comment, title: ticket.title, href: `/inbox/${encodeURIComponent(ticket.id)}` })))
      return { total: comments.length, comments: comments.slice(args.offset, args.offset + 30), coverage: 'کامنت‌های ذخیره‌شدهٔ تیکت در پروژه‌های قابل‌دسترسی' }
    },
  }
  return {
    reportFor,
    run(user, name, rawArguments) {
      const skill = skillMap.get(name)
      if (!skill) throw new DomainError(400, 'unknown_skill', 'ابزار در دسترس نیست.')
      const parsed = skill.schema.safeParse(rawArguments)
      if (!parsed.success) throw new DomainError(400, 'invalid_skill_input', parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('\n').slice(0, 1200))
      return handlers[name](user, parsed.data)
    },
    confirm(user, id, keys) {
      const result = store.confirm(user, id, keys, (kind, items) => {
        const saved = items.map(item => {
          if (kind === 'dashboards_create') {
            const dashboard = dashboardService.create(user, item.input)
            return { id: dashboard.id, title: dashboard.name, href: '/inbox' }
          }
          if (kind === 'tasks_create') {
            const input = { ...item.input, subtasks: item.input.subtasks.map(subtask => taskService.validate(user, subtask)) }
            const task = taskService.create(user, input)
            return { id: task.id, title: task.title, projectId: task.projectId, href: `/tasks/${task.id}` }
          }
          if (kind === 'tasks_update') {
            const previous = taskService.get(user, item.taskId)
            if (fingerprint(previous) !== item.fingerprint) throw new DomainError(409, 'stale_preview', 'تسک تغییر کرده است. پیش‌نمایش تازه بسازید.')
            const task = taskService.update(user, item.taskId, item.patch)
            return { id: task.id, title: task.title, projectId: task.projectId, href: `/tasks/${task.id}` }
          }
          if (kind === 'ticket_create') {
            const { member } = ticketProject(user, item.input)
            const ticket = ticketRepository.save(randomUUID(), { ...item.input, status: 'todo', createdById: user.id, createdByName: user.name, assigneeName: member?.name, followers: [], favorites: [] }, user)
            if (member) notificationRepository.createTicketAssignmentNotification(ticket, member, user)
            return { id: ticket.id, title: ticket.title, projectId: ticket.projectId, href: `/inbox/${ticket.id}` }
          }
          divisionFor(user, item.input.divisionId)
          const project = organizationRepository.createProject(user.id, item.input.divisionId, item.input.name)
          if (!project || project.conflict) throw new DomainError(409, 'project_conflict', 'پروژه قابل ساخت نیست. نام یا دسترسی را بررسی کنید.')
          return { id: project.id, title: project.name, projectId: project.id, href: `/home/projects/${project.id}` }
        })
        return { items: saved }
      })
      for (const item of result.items) if (item.projectId) taskService.projectFor(user, item.projectId)
      return result
    },
  }
}
