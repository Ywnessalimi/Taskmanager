"use client"

import { useRouter } from "next/navigation"
import { Dialog } from "@/components/ui/dialog"
import { NewTaskDialog } from "@/features/tasks/new-task-dialog"
import type { CurrentUser, Task, TaskFormProjectOption } from "@/lib/api/types"

export function TaskDetailRoute({ task, projects, user }: { task: Task; projects: TaskFormProjectOption[]; user: CurrentUser }) {
  const router = useRouter()
  const returnToNotifications = () => router.push("/notifications")
  return (
    <Dialog open onOpenChange={(open) => { if (!open) returnToNotifications() }}>
      <NewTaskDialog key={task.id} task={task} projects={projects} defaultProjectId={task.projectId} user={user} onDone={returnToNotifications} />
    </Dialog>
  )
}
