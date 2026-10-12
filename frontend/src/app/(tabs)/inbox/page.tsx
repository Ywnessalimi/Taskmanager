import { TicketInbox } from "@/features/tickets/ticket-inbox"
import { getCurrentUser } from "@/lib/api/users"
export default async function InboxPage(){return <TicketInbox user={await getCurrentUser()} />}
