const STATUSES = new Set(['todo', 'in-progress', 'completed'])

// Reconstruct end-of-day status for existing tasks using recorded transitions.
export function projectStatusHistory(tasks, changes, now = new Date(), dayCount = 12) {
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  const start = end - dayCount * 86_400_000
  const days = Array.from({ length: dayCount }, (_, index) => ({ day: new Date(start + index * 86_400_000).toISOString().slice(0, 10), todo: 0, inProgress: 0, completed: 0 }))
  const byTask = new Map()
  for (const change of changes) {
    if (!STATUSES.has(change.from) || !Number.isFinite(Date.parse(change.createdAt))) continue
    const list = byTask.get(change.taskId) ?? []
    list.push(change)
    byTask.set(change.taskId, list)
  }
  for (const list of byTask.values()) list.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.cursor - a.cursor)
  for (const task of tasks) {
    let status = task.status
    const createdAt = Date.parse(task.createdAt)
    if (!STATUSES.has(status) || !Number.isFinite(createdAt)) continue
    const events = byTask.get(task.id) ?? []
    let cursor = 0
    for (let index = dayCount - 1; index >= 0; index--) {
      const dayEnd = start + (index + 1) * 86_400_000
      while (cursor < events.length && Date.parse(events[cursor].createdAt) >= dayEnd) status = events[cursor++].from
      if (createdAt >= dayEnd) continue
      days[index][status === 'in-progress' ? 'inProgress' : status]++
    }
  }
  return { from: new Date(start).toISOString(), to: new Date(end).toISOString(), timeZone: 'UTC', days }
}
