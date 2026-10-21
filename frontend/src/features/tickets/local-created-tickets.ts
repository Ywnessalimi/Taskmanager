import { deleteTicket, saveTicket } from "@/lib/api/ticket-comments"
import { getCurrentUser } from "@/lib/api/users"
import type { NewTicketInput, TicketStatus } from "@/lib/api/types"

export type LocalTicket = NewTicketInput & { id: string; createdAt: string; updatedAt: string }

/** Compatibility name retained for existing UI callers; the record is saved through API/SQLite. */
export async function saveLocalTicket(id: string, input: NewTicketInput): Promise<void> {
  const user = await getCurrentUser()
  await saveTicket(id, input, { id: user.id, name: user.name, avatarUrl: user.avatarUrl })
  window.dispatchEvent(new Event("tickets-changed"))
}

export async function deleteLocalTicket(id: string): Promise<void> {
  await deleteTicket(id)
  window.dispatchEvent(new Event("tickets-changed"))
}

export function ticketStatus(status: string): TicketStatus {
  if (status === "in-progress" || status === "in-review") return "in-progress"
  if (status === "completed" || status === "closed") return "completed"
  return "todo"
}
