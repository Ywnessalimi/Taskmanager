import { TaskDetailRoute } from "@/features/tasks/task-detail-route"
import { getTask, getTaskFormOptions } from "@/lib/api/tasks"
import { getCurrentUser } from "@/lib/api/users"

export default async function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const [{ taskId }, projects, user] = await Promise.all([params, getTaskFormOptions(), getCurrentUser()])
  const task = await getTask(taskId)
  if (!task) return <div data-no-mobile-nav className="p-4 text-sm text-text2">این تسک پیدا نشد.</div>
  return <div data-no-mobile-nav className="flex min-h-0 flex-1"><TaskDetailRoute task={task} projects={projects} user={user} /></div>
}
