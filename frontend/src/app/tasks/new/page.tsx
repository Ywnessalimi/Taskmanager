import { MobileTaskCreateForm } from "@/features/tasks/mobile-task-create-form"
import { getTaskFormOptions } from "@/lib/api/tasks"
import { getCurrentUser } from "@/lib/api/users"

export default async function NewTaskPage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const [projects, user, query] = await Promise.all([getTaskFormOptions(), getCurrentUser(), searchParams])
  return <MobileTaskCreateForm projects={projects} user={user} defaultProjectId={query.projectId} />
}
