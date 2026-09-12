"use client"

import { RemixIcon } from "@/components/ui/remix-icon"

/** ۵ نمای نمایش تسک (مشترک بین صفحه‌ی پروژه و تب «تسک‌های من»). */
export const TASK_VIEWS = [
  { id: "tree", label: "درختی", icon: "node-tree" },
  { id: "board", label: "برد", icon: "kanban-view" },
  { id: "table", label: "جدول", icon: "table-line" },
  { id: "timeline", label: "خط زمانی", icon: "calendar-schedule-line" },
  { id: "calendar", label: "تقویم", icon: "calendar-line" },
] as const

export type TaskViewId = (typeof TASK_VIEWS)[number]["id"]

/** نوار سوییچ نما: آیکون + متن، با بوردر نازک زیر کل نوار. */
export function ViewSwitcher({
  view,
  onChange,
}: {
  view: TaskViewId
  onChange: (view: TaskViewId) => void
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border pb-1.5">
      {TASK_VIEWS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs ${
            view === item.id ? "bg-background text-foreground" : "text-text2 hover:text-foreground"
          }`}
        >
          <RemixIcon name={item.icon} className="text-sm" />
          {item.label}
        </button>
      ))}
    </div>
  )
}
