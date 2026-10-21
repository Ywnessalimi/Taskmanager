import { listInboxTickets, listTickets } from "@/lib/api/ticket-comments"
import type { Locale } from "@/lib/i18n/dictionary"
import type { LocalTicket } from "./local-created-tickets"

/** Reads the durable ticket records from the authenticated API. */
export async function getTickets(_locale: Locale): Promise<LocalTicket[]> {
  return listTickets()
}

/** Reads tickets created by or assigned to the signed-in user for the Inbox. */
export async function getInboxTickets(_locale: Locale): Promise<LocalTicket[]> {
  return listInboxTickets()
}
