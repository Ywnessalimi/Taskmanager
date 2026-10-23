"use client"

import { usePathname } from "next/navigation"
import { useTaskPanel } from "@/components/providers/task-panel-provider"
import { Dialog } from "@/components/ui/dialog"
import { NewTaskDialog } from "./new-task-dialog"
import { readTaskDetails } from "./local-task-details"

/** میزبان مودال مشترک ساخت/جزئیات؛ فضای لیست را جمع نمی‌کند. */
export function TaskPanel() {
  const context = useTaskPanel()
  const pathname = usePathname()
  const state = context?.panel
  if (!context || !state) return null

  const task = state.kind === "detail" ? readTaskDetails(state.parentTask ?? state.task) : undefined
  const routeProjectId = pathname.match(/\/projects\/([^/]+)/)?.[1]
  const projectId = task?.projectId ?? (state.kind === "new" ? state.projectId : undefined) ?? context.projects.find((project) => project.id === routeProjectId)?.id
  const initialSubtaskId = state.kind === "detail" && state.parentTask ? state.task.id : undefined

  return <Dialog open onOpenChange={(open) => { if (!open) context.close() }}>
    <NewTaskDialog
      key={task?.id ?? "new"}
      task={task}
      initialSubtaskId={initialSubtaskId}
      projects={context.projects}
      defaultProjectId={projectId}
      user={context.user}
      onDone={context.close}
    />
  </Dialog>
}
