import { TicketCreateForm } from "@/features/tickets/ticket-create-form"
import { getCurrentUser } from "@/lib/api/users"

export default async function NewTicketPage() {
  return <TicketCreateForm user={await getCurrentUser()} />
}
