import { TicketDetail } from "@/features/tickets/ticket-detail"
import { getCurrentUser } from "@/lib/api/users"

export default async function TicketModalPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const [{ ticketId }, user] = await Promise.all([params, getCurrentUser()])
  return <TicketDetail ticketId={ticketId} user={user} modalOnly />
}
