import { PRIORITY_LABEL, PriorityDot, STATUS_LABEL } from "@/features/projects/task-display"
import type { Task } from "@/lib/api/types"

export function TableView({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return <p className="py-8 text-center text-sm text-text2">تسکی وجود ندارد.</p>
  }

  return (
    <div className="flex flex-col">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0">
          <PriorityDot priority={task.priority} />
          <span className="w-12 shrink-0 text-xs text-text3">{task.displayId}</span>
          <span className="min-w-0 flex-1 truncate text-sm text-foreground">{task.title}</span>
          <span className="hidden shrink-0 text-xs text-text2 sm:inline">{task.assigneeName ?? "—"}</span>
          <span className="shrink-0 text-xs text-text2" title={PRIORITY_LABEL[task.priority]}>
            {STATUS_LABEL[task.status]}
          </span>
        </div>
      ))}
    </div>
  )
}
