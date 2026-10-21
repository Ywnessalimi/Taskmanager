import { randomUUID } from "node:crypto"

function parseJson(value, fallback) {
  if (value === null || value === undefined) return fallback
  return JSON.parse(value)
}

function toTask(row) {
  if (!row) return undefined
  return {
    id: row.id,
    displayId: row.display_id,
    projectId: row.project_id,
    title: row.title,
    assigneeNames: parseJson(row.assignee_names, []),
    priority: row.priority,
    startDate: row.start_date ?? undefined,
    dueDate: row.due_date ?? undefined,
    repeat: row.repeat ?? undefined,
    recurrence: parseJson(row.recurrence, undefined),
    status: row.status,
    tags: parseJson(row.tags, []),
    description: row.description ?? undefined,
    subtasks: parseJson(row.subtasks, []),
    followers: parseJson(row.followers, []),
    isFavorite: Boolean(row.is_favorite),
    timeSpentMinutes: row.time_spent_minutes,
    activityLog: parseJson(row.activity_log, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toProject(row) {
  if (!row) return undefined
  return {
    id: row.id,
    name: row.name,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    divisionId: row.division_id,
    divisionName: row.division_name,
    startDate: row.start_date ?? "",
    endDate: row.end_date ?? "",
    description: row.description ?? undefined,
  }
}

export function createTaskRepository(database) {
  const getTaskStatement = database.prepare("SELECT * FROM tasks WHERE id = ?")

  function getTask(id) {
    return toTask(getTaskStatement.get(id))
  }

  function listTasks({ projectId, projectIds, assigneeName } = {}) {
    let tasks
    if (projectId) {
      tasks = database.prepare("SELECT * FROM tasks WHERE project_id = ? ORDER BY rowid").all(projectId).map(toTask)
    } else if (projectIds) {
      if (projectIds.length === 0) return []
      const placeholders = projectIds.map(() => "?").join(", ")
      tasks = database.prepare(`SELECT * FROM tasks WHERE project_id IN (${placeholders}) ORDER BY rowid`).all(...projectIds).map(toTask)
    } else {
      tasks = database.prepare("SELECT * FROM tasks ORDER BY rowid").all().map(toTask)
    }

    if (!assigneeName) return tasks
    return tasks.filter((task) =>
      task.assigneeNames.includes(assigneeName) || task.subtasks?.some((subtask) => subtask.assigneeNames?.includes(assigneeName)),
    )
  }

  function listProjects(ownerId) {
    const rows = ownerId
      ? database.prepare("SELECT p.* FROM projects p JOIN organization_members m ON m.organization_id = p.organization_id WHERE m.user_id = ? ORDER BY p.rowid").all(ownerId)
      : database.prepare("SELECT * FROM projects ORDER BY rowid").all()
    return rows.map(toProject)
  }

  function getProject(id, ownerId) {
    const row = ownerId
      ? database.prepare("SELECT p.* FROM projects p JOIN organization_members m ON m.organization_id = p.organization_id WHERE p.id = ? AND m.user_id = ?").get(id, ownerId)
      : database.prepare("SELECT * FROM projects WHERE id = ?").get(id)
    return toProject(row)
  }

  function createTask(input) {
    const id = randomUUID()
    const sequence = database.prepare("UPDATE task_display_sequence SET last_value = last_value + 1 WHERE id = 1 RETURNING last_value").get()
    const displayId = `#${sequence.last_value}`
    const now = new Date().toISOString()
    const subtasks = (input.subtasks ?? []).map((subtask, index) => ({
      ...subtask,
      id: subtask.id ?? randomUUID(),
      displayId: subtask.displayId ?? `${displayId}-${index + 1}`,
      assigneeNames: subtask.assigneeNames ?? [],
      priority: subtask.priority ?? "none",
      status: subtask.status ?? "todo",
    }))

    database.prepare(`
      INSERT INTO tasks (
        id, display_id, project_id, title, assignee_names, priority, status, start_date, due_date,
        repeat, recurrence, tags, description, subtasks, followers, is_favorite,
        time_spent_minutes, activity_log, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      displayId,
      input.projectId,
      input.title,
      JSON.stringify(input.assigneeNames ?? []),
      input.priority ?? "none",
      input.status ?? "todo",
      input.startDate ?? null,
      input.dueDate ?? null,
      input.repeat ?? null,
      input.recurrence ? JSON.stringify(input.recurrence) : null,
      JSON.stringify(input.tags ?? []),
      input.description ?? null,
      JSON.stringify(subtasks),
      JSON.stringify(input.followers ?? []),
      input.isFavorite ? 1 : 0,
      input.timeSpentMinutes ?? 0,
      JSON.stringify(input.activityLog ?? []),
      now,
      now,
    )

    return getTask(id)
  }

  function updateTask(id, patch) {
    const current = getTask(id)
    if (!current) return undefined
    const next = { ...current, ...patch, id, displayId: current.displayId, updatedAt: new Date().toISOString() }

    database.prepare(`
      UPDATE tasks SET
        project_id = ?, title = ?, assignee_names = ?, priority = ?, status = ?, start_date = ?, due_date = ?,
        repeat = ?, recurrence = ?, tags = ?, description = ?, subtasks = ?, followers = ?, is_favorite = ?,
        time_spent_minutes = ?, activity_log = ?, updated_at = ?
      WHERE id = ?
    `).run(
      next.projectId,
      next.title,
      JSON.stringify(next.assigneeNames ?? []),
      next.priority,
      next.status,
      next.startDate ?? null,
      next.dueDate ?? null,
      next.repeat ?? null,
      next.recurrence ? JSON.stringify(next.recurrence) : null,
      JSON.stringify(next.tags ?? []),
      next.description ?? null,
      JSON.stringify(next.subtasks ?? []),
      JSON.stringify(next.followers ?? []),
      next.isFavorite ? 1 : 0,
      next.timeSpentMinutes ?? 0,
      JSON.stringify(next.activityLog ?? []),
      next.updatedAt,
      id,
    )

    return getTask(id)
  }

  function deleteTask(id) {
    return database.prepare("DELETE FROM tasks WHERE id = ?").run(id).changes > 0
  }

  function close() {
    database.close()
  }

  return { getTask, listTasks, listProjects, getProject, createTask, updateTask, deleteTask, close }
}
