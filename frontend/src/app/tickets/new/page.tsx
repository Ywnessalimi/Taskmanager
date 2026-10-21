import { TicketCreateForm } from "@/features/tickets/ticket-create-form"
import { getCurrentUser } from "@/lib/api/users"
import { getTaskFormOptions } from "@/lib/api/tasks"

export default async function NewTicketPage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const [{ projectId }, user, projects] = await Promise.all([searchParams, getCurrentUser(), getTaskFormOptions()])
  return <TicketCreateForm user={user} projectId={projectId} projects={projects} />
}
