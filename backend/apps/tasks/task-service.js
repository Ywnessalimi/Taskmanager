export class DomainError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function validateTaskInput(value, { partial = false } = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new DomainError(400, "invalid_body", "بدنهٔ درخواست باید یک شیء باشد.")
  }
  const input = { ...value }
  if (!partial || "title" in input) {
    if (typeof input.title !== "string" || !input.title.trim()) throw new DomainError(400, "invalid_title", "عنوان تسک الزامی است.")
    input.title = input.title.trim()
  }
  if (!partial || "projectId" in input) {
    if (typeof input.projectId !== "string" || !input.projectId.trim()) throw new DomainError(400, "invalid_project", "پروژهٔ تسک الزامی است.")
  }
  const arrays = ["assigneeNames", "tags", "subtasks", "followers", "activityLog"]
  for (const field of arrays) {
    if (field in input && !Array.isArray(input[field])) throw new DomainError(400, "invalid_field", `${field} باید آرایه باشد.`)
  }
  if ("priority" in input && !["none", "low", "medium", "high", "urgent"].includes(input.priority)) throw new DomainError(400, "invalid_priority", "اولویت معتبر نیست.")
  if ("status" in input && !["todo", "in-progress", "completed"].includes(input.status)) throw new DomainError(400, "invalid_status", "وضعیت معتبر نیست.")
  if ("repeat" in input && input.repeat != null && !["none", "daily", "weekly", "monthly"].includes(input.repeat)) throw new DomainError(400, "invalid_repeat", "الگوی تکرار معتبر نیست.")
  if ("isFavorite" in input && typeof input.isFavorite !== "boolean") throw new DomainError(400, "invalid_field", "isFavorite باید boolean باشد.")
  if ("timeSpentMinutes" in input && (!Number.isInteger(input.timeSpentMinutes) || input.timeSpentMinutes < 0)) throw new DomainError(400, "invalid_field", "زمان صرف‌شده باید عدد صحیح نامنفی باشد.")
  for (const field of ["startDate", "dueDate", "description"]) {
    if (field in input && input[field] != null && typeof input[field] !== "string") throw new DomainError(400, "invalid_field", `${field} باید رشته باشد.`)
  }
  return input
}


export function transaction(database, work) {
  database.exec('SAVEPOINT domain_write')
  try {
    const result = work()
    database.exec('RELEASE domain_write')
    return result
  } catch (error) {
    database.exec('ROLLBACK TO domain_write')
    database.exec('RELEASE domain_write')
    throw error
  }
}

export function createTaskService({ database, repository, organizationRepository, notificationRepository, organizationActivityRepository, validateTaskInput }) {
  function projectFor(user, projectId) {
    const project = organizationRepository.getProject(projectId, user.id)
    if (!project) throw new DomainError(404, 'project_not_found', 'پروژه پیدا نشد یا دسترسی ندارید.')
    return project
  }

  function normalize(user, value, previous) {
    const input = validateTaskInput(value, { partial: Boolean(previous) })
    const project = projectFor(user, input.projectId ?? previous?.projectId)
    const assignmentsChanged = 'assigneeIds' in input || 'assigneeNames' in input || (previous && project.id !== previous.projectId)
    if (assignmentsChanged || !previous) {
      let ids = input.assigneeIds
      if (ids === undefined && previous?.assigneeIds?.length && (!('assigneeNames' in input) || JSON.stringify(input.assigneeNames) === JSON.stringify(previous.assigneeNames))) ids = previous.assigneeIds
      if (ids === undefined) {
        const names = input.assigneeNames ?? previous?.assigneeNames ?? []
        if (!Array.isArray(names) || names.some(name => typeof name !== 'string')) throw new DomainError(400, 'invalid_assignees', 'مسئولان معتبر نیستند.')
        ids = names.map(name => {
          const matches = project.members.filter(member => member.name === name)
          if (matches.length !== 1) throw new DomainError(400, 'ambiguous_assignee', 'مسئول را با شناسهٔ معتبر و یکتا انتخاب کنید.')
          return matches[0].id
        })
      }
      if (!Array.isArray(ids) || ids.length > 50 || ids.some(id => typeof id !== 'string' || !project.memberIds.includes(id))) {
        throw new DomainError(400, 'invalid_assignees', 'مسئول انتخاب‌شده به پروژه دسترسی ندارد.')
      }
      input.assigneeIds = [...new Set(ids)]
      input.assigneeNames = input.assigneeIds.map(id => project.members.find(member => member.id === id).name)
    }
    delete input.actorId
    delete input.actorName
    return { input, project }
  }

  function get(user, id) {
    const task = repository.getTask(id)
    if (!task) throw new DomainError(404, 'task_not_found', 'تسک پیدا نشد.')
    projectFor(user, task.projectId)
    return task
  }

  return {
    projectFor,
    get,
    validate(user, input) { return normalize(user, input).input },
    create(user, value) {
      return transaction(database, () => {
        const { input, project } = normalize(user, value)
        const task = repository.createTask(input)
        organizationActivityRepository.create(project.organizationId, user, 'task_created', { title: task.title }, task.id)
        notificationRepository.createTaskAssignmentNotifications(task, user)
        return task
      })
    },
    update(user, id, value) {
      return transaction(database, () => {
        const previous = get(user, id)
        const { input, project } = normalize(user, value, previous)
        const task = repository.updateTask(id, input)
        if (previous.status !== task.status) {
          organizationActivityRepository.create(project.organizationId, user, 'task_status_changed', { title: task.title, from: previous.status, to: task.status }, task.id)
        }
        const assignedIds = task.assigneeIds.filter(memberId => !previous.assigneeIds.includes(memberId))
        if (assignedIds.length) notificationRepository.createTaskAssignmentNotifications({ ...task, assigneeIds: assignedIds, assigneeNames: assignedIds.map(memberId => project.members.find(member => member.id === memberId).name) }, user)
        return task
      })
    },
  }
}
