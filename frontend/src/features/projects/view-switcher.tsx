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

/**
 * نوار سوییچ نما — طبق بازخورد کاربر: آیکون سمت راست و متن سمت چپ (یعنی در DOM آیکون قبل
 * از متن می‌آید، چون در RTL اولین فرزند سمت راست می‌نشیند). نمای فعال با بوردر + پس‌زمینه‌ی
 * خاکستری کم‌رنگ مشخص می‌شود، بقیه فقط متن ساده‌ی کم‌رنگ‌اند.
 */
export function ViewSwitcher({
  view,
  onChange,
}: {
  view: TaskViewId
  onChange: (view: TaskViewId) => void
}) {
  const t = useT()

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border pb-2">
      {TASK_VIEWS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={`flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-sm ${
            view === item.id
              ? "border-border bg-bg2 text-foreground"
              : "border-transparent text-text2 hover:text-foreground"
          }`}
        >
          <RemixIcon name={item.icon} className="text-base" />
          {t(item.labelKey)}
        </button>
      ))}
    </div>
  )
}
