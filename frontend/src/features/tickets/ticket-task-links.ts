export const TICKET_TASK_LINKS_KEY = "quire:task-ticket-links:v1"
const TICKET_TASK_LINKS_CHANGED = "ticket-task-links-changed"

export type TicketTaskLink = { taskId: string; index: number }
export type TicketTaskLinks = Record<string, TicketTaskLink>

export function readTicketTaskLinks(): TicketTaskLinks {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(TICKET_TASK_LINKS_KEY) ?? "{}")
    if (!value || typeof value !== "object" || Array.isArray(value)) return {}
    const links: TicketTaskLinks = {}
    const nextIndexByTask = new Map<string, number>()
    for (const [ticketId, rawLink] of Object.entries(value)) {
      if (!ticketId) continue
      if (typeof rawLink === "string") {
        const index = nextIndexByTask.get(rawLink) ?? 0
        links[ticketId] = { taskId: rawLink, index }
        nextIndexByTask.set(rawLink, index + 1)
      } else if (rawLink && typeof rawLink === "object") {
        const link = rawLink as { taskId?: unknown; index?: unknown }
        if (typeof link.taskId === "string" && Number.isInteger(link.index) && Number(link.index) >= 0) {
          links[ticketId] = { taskId: link.taskId, index: Number(link.index) }
        }
      }
    }
    return links
  } catch {
    return {}
  }
}

/** Prototype-only relation: one Ticket can be attached to one Task at a time, at a chosen position. */
export function linkTicketToTask(
  ticketId: string,
  taskId: string,
  index: number,
  currentLinks: TicketTaskLinks = readTicketTaskLinks(),
): TicketTaskLinks {
  const sourceTaskId = currentLinks[ticketId]?.taskId
  const next = { ...currentLinks }
  const targetTickets = Object.entries(next)
    .filter(([id, link]) => id !== ticketId && link.taskId === taskId)
    .sort(([, left], [, right]) => left.index - right.index)
    .map(([id]) => id)
  const insertAt = Math.max(0, Math.min(index, targetTickets.length))
  targetTickets.splice(insertAt, 0, ticketId)
  delete next[ticketId]

  if (sourceTaskId && sourceTaskId !== taskId) {
    Object.entries(next)
      .filter(([, link]) => link.taskId === sourceTaskId)
      .sort(([, left], [, right]) => left.index - right.index)
      .forEach(([id], position) => { next[id] = { taskId: sourceTaskId, index: position } })
  }
  targetTickets.forEach((id, position) => { next[id] = { taskId, index: position } })

  const links = next
  localStorage.setItem(TICKET_TASK_LINKS_KEY, JSON.stringify(links))
  window.dispatchEvent(new Event(TICKET_TASK_LINKS_CHANGED))
  return links
}

/** Detaches a ticket from its task and compacts the remaining ticket positions. */
export function unlinkTicketFromTask(
  ticketId: string,
  currentLinks: TicketTaskLinks = readTicketTaskLinks(),
): TicketTaskLinks {
  const sourceTaskId = currentLinks[ticketId]?.taskId
  if (!sourceTaskId) return currentLinks

  const next = { ...currentLinks }
  delete next[ticketId]
  Object.entries(next)
    .filter(([, link]) => link.taskId === sourceTaskId)
    .sort(([, left], [, right]) => left.index - right.index)
    .forEach(([id], index) => { next[id] = { taskId: sourceTaskId, index } })

  localStorage.setItem(TICKET_TASK_LINKS_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(TICKET_TASK_LINKS_CHANGED))
  return next
}
