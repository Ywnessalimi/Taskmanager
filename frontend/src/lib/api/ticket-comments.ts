import { backendRequest } from "./backend-client"
import type { NewTicketCommentInput, NewTicketInput, TicketComment, TicketActivity } from "./types"

export function getTicket(ticketId: string) { return backendRequest<NewTicketInput & { id: string; createdAt: string; updatedAt: string }>(`/tickets/${encodeURIComponent(ticketId)}`) }
export function listTickets() { return backendRequest<Array<NewTicketInput & { id: string; createdAt: string; updatedAt: string }>>("/tickets") }
export function listInboxTickets() { return backendRequest<Array<NewTicketInput & { id: string; createdAt: string; updatedAt: string }>>("/tickets/inbox") }
export function saveTicket(ticketId: string, ticket: NewTicketInput, actor: { id: string; name: string; avatarUrl?: string }) {
  return backendRequest<NewTicketInput & { id: string; createdAt: string; updatedAt: string }>(`/tickets/${encodeURIComponent(ticketId)}`, { method: "PUT", body: JSON.stringify({ ticket, actor }) })
}
export function listTicketActivity(ticketId: string) { return backendRequest<TicketActivity[]>(`/tickets/${encodeURIComponent(ticketId)}/activity`) }
export function deleteTicket(ticketId: string) { return backendRequest<void>(`/tickets/${encodeURIComponent(ticketId)}`, { method: "DELETE" }) }

/** Loads persistent comments for one ticket from the local API. */
export function listTicketComments(ticketId: string): Promise<TicketComment[]> {
  return backendRequest<TicketComment[]>(`/tickets/${encodeURIComponent(ticketId)}/comments`)
}

/** Creates a comment; the server supplies its id and creation timestamp. */
export function createTicketComment(ticketId: string, input: NewTicketCommentInput): Promise<TicketComment> {
  return backendRequest<TicketComment>(`/tickets/${encodeURIComponent(ticketId)}/comments`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}
