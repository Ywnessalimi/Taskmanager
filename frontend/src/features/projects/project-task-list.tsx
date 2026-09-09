"use client"

import { useState } from "react"
import type { Task } from "@/lib/api/types"

const VIEWS = [
  { id: "tree", label: "درختی" },
  { id: "board", label: "برد" },
  { id: "table", label: "جدول" },
  { id: "timeline", label: "خط زمانی" },
  { id: "calendar", label: "تقویم" },
] as const

type ViewId = (typeof VIEWS)[number]["id"]

const STATUS_LABEL: Record<Task["status"], string> = {
  todo: "در انتظار",
  "in-progress": "در حال انجام",
  completed: "انجام‌شده",
}

const PRIORITY_LABEL: Record<Task["priority"], string> = {
  none: "بدون اولویت",
  low: "کم",
  medium: "متوسط",
  high: "بالا",
  urgent: "فوری",
}

/** فقط از توکن‌های رنگی موجود در colors.css استفاده می‌کند — هنوز توکن اختصاصی برای «بالا» تعریف نشده. */
const PRIORITY_COLOR: Record<Task["priority"], string> = {
  none: "var(--text3)",
  low: "var(--link)",
  medium: "var(--warning)",
  high: "var(--error)",
  urgent: "var(--error)",
}

/**
 * List section پروژه: سوییچر ۵ نما + فقط نمای Table واقعاً پیاده شده.
 * بقیه‌ی نماها (Tree/Board/Timeline/Calendar) فعلاً Placeholder‌اند — رجوع به docs/FRONTEND.md.
 */
export function ProjectTaskList({ tasks }: { tasks: Task[] }) {
  const [view, setView] = useState<ViewId>("table")

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 overflow-x-auto">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={`shrink-0 rounded-md px-2.5 py-1 text-xs ${
              view === v.id ? "bg-bg2 text-foreground" : "text-text2 hover:text-foreground"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "table" ? (
        <div className="flex flex-col">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: PRIORITY_COLOR[task.priority] }}
                title={PRIORITY_LABEL[task.priority]}
              />
              <span className="w-12 shrink-0 text-xs text-text3">{task.displayId}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">{task.title}</span>
              <span className="hidden shrink-0 text-xs text-text2 sm:inline">{task.assigneeName ?? "—"}</span>
              <span className="shrink-0 text-xs text-text2">{STATUS_LABEL[task.status]}</span>
            </div>
          ))}
          {tasks.length === 0 && <p className="py-8 text-center text-sm text-text2">تسکی وجود ندارد.</p>}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-text2">
          نمای «{VIEWS.find((v) => v.id === view)?.label}» به‌زودی اضافه می‌شود.
        </p>
      )}
    </div>
  )
}
