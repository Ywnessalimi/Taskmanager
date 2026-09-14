"use client"

import { useT } from "@/components/providers/locale-provider"
import { RemixIcon } from "@/components/ui/remix-icon"
import type { TranslationKey } from "@/lib/i18n/dictionary"

/** ۵ نمای نمایش تسک (مشترک بین صفحه‌ی پروژه و تب «تسک‌های من»). */
export const TASK_VIEWS = [
  { id: "tree", labelKey: "view.tree", icon: "node-tree" },
  { id: "board", labelKey: "view.board", icon: "kanban-view" },
  { id: "table", labelKey: "view.table", icon: "table-line" },
  { id: "timeline", labelKey: "view.timeline", icon: "calendar-schedule-line" },
  { id: "calendar", labelKey: "view.calendar", icon: "calendar-line" },
] satisfies { id: string; labelKey: TranslationKey; icon: string }[]

export type TaskViewId = (typeof TASK_VIEWS)[number]["id"]

/** نوار سوییچ نما: آیکون + متن، با بوردر نازک زیر کل نوار. */
export function ViewSwitcher({
  view,
  onChange,
}: {
  view: TaskViewId
  onChange: (view: TaskViewId) => void
}) {
  const t = useT()

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
          {t(item.labelKey)}
        </button>
      ))}
    </div>
  )
}
