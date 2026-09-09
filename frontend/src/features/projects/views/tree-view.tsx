"use client"

import { useState } from "react"
import { RemixIcon } from "@/components/ui/remix-icon"
import { PriorityDot, STATUS_LABEL } from "@/features/projects/task-display"
import type { Task } from "@/lib/api/types"

function TreeRow({ task, depth }: { task: Task; depth: number }) {
  const [open, setOpen] = useState(false)
  const hasChildren = Boolean(task.subtasks && task.subtasks.length > 0)

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2"
        style={{ paddingInlineStart: depth * 20 }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "بستن زیر-تسک‌ها" : "باز کردن زیر-تسک‌ها"}
            className="flex size-5 shrink-0 items-center justify-center text-icon2 hover:text-icon"
          >
            <RemixIcon name={open ? "arrow-down-s-line" : "arrow-left-s-line"} className="text-base" />
          </button>
        ) : (
          <span className="size-5 shrink-0" />
        )}
        <PriorityDot priority={task.priority} />
        <span className="w-12 shrink-0 text-xs text-text3">{task.displayId}</span>
        <span className="min-w-0 flex-1 truncate text-sm text-foreground">{task.title}</span>
        <span className="shrink-0 text-xs text-text2">{STATUS_LABEL[task.status]}</span>
      </div>

      {hasChildren && open && (
        <div className="border-t border-border">
          {task.subtasks!.map((subtask) => (
            <TreeRow key={subtask.id} task={subtask} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function TreeView({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return <p className="py-8 text-center text-sm text-text2">تسکی وجود ندارد.</p>
  }

  return (
    <div className="flex flex-col">
      {tasks.map((task, index) => (
        <div key={task.id} className={index > 0 ? "border-t border-border" : ""}>
          <TreeRow task={task} depth={0} />
        </div>
      ))}
    </div>
  )
}
