import type { NewTicketInput } from "./types"
import { getCurrentUser } from "./users"
import { saveTicket } from "./ticket-comments"

/** Creates a durable Ticket record and records the authenticated actor in server Activity. */
export async function createTicket(input: NewTicketInput) {
  const user = await getCurrentUser()
  const id = crypto.randomUUID()
  return saveTicket(id, {
    ...input,
    createdById: user.id,
    createdByName: user.name,
    createdByAvatarUrl: user.avatarUrl,
  }, { id: user.id, name: user.name, avatarUrl: user.avatarUrl })
}
