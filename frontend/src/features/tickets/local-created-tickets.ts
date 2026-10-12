import type { NewTicketInput } from "@/lib/api/types"

export const LOCAL_TICKETS_KEY = "quire:created-tickets:v1"
export type LocalTicket = NewTicketInput & { id: string; createdAt: string; updatedAt: string }
export function readLocalTickets(): LocalTicket[] {
  const parsed: unknown = JSON.parse(localStorage.getItem(LOCAL_TICKETS_KEY) ?? "[]")
  if (!Array.isArray(parsed)) throw new Error("Invalid ticket storage")
  return parsed as LocalTicket[]
}
export async function saveLocalTicket(id: string, input: NewTicketInput): Promise<void> {
  const tickets = readLocalTickets(), now = new Date().toISOString()
  const createdAt = tickets.find(ticket => ticket.id === id)?.createdAt ?? now
  localStorage.setItem(LOCAL_TICKETS_KEY, JSON.stringify([...tickets.filter(ticket => ticket.id !== id), { ...input, id, createdAt, updatedAt: now }]))
  window.dispatchEvent(new Event("tickets-changed"))
}
export async function deleteLocalTicket(id: string): Promise<void> {
  localStorage.setItem(LOCAL_TICKETS_KEY, JSON.stringify(readLocalTickets().filter(ticket => ticket.id !== id)))
  const removed: string[] = JSON.parse(localStorage.getItem("quire:deleted-tickets:v1") ?? "[]")
  localStorage.setItem("quire:deleted-tickets:v1",JSON.stringify([...new Set([...removed,id])]))
  window.dispatchEvent(new Event("tickets-changed"))
}
