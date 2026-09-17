"use client"

import { useTaskPanel } from "@/components/providers/task-panel-provider"
import { useT } from "@/components/providers/locale-provider"
import { RemixIcon } from "@/components/ui/remix-icon"
import { TaskCreateForm } from "./task-create-form"
import { TaskDetailForm } from "./task-detail-form"

/**
 * پنل کناری تسک — عمداً مودال نیست: داخل ردیف flexِ `SectionTabs` می‌نشیند (سمت شروع/راست)
 * و باعث می‌شود باکس لیست/نمای‌کلی کنارش جمع شود، به‌جای اینکه روی کل صفحه بیفتد.
 *
 * روی صفحه‌های باریک (زیر `lg`) عرض کامل می‌گیرد و `SectionTabs` تب‌ها را پنهان می‌کند،
 * وگرنه دو ستون کنار هم در آن عرض جا نمی‌شوند.
 */
export function TaskPanel() {
  const context = useTaskPanel()
  const t = useT()
  const state = context?.panel

  if (!context || !state) return null

  return (
    <aside
      data-slot="task-panel"
      className="flex w-full shrink-0 flex-col border-e border-border bg-background lg:w-80"
    >
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <h2 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {state.kind === "new" ? t("nav.newTask") : t("taskDetail.title")}
        </h2>
        <button
          type="button"
          onClick={context.close}
          aria-label={t("taskDetail.close")}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-icon2 hover:bg-bg2 hover:text-icon"
        >
          <RemixIcon name="close-line" className="text-base" />
        </button>
      </div>

      {state.kind === "new" ? (
        <TaskCreateForm projects={context.projects} onDone={context.close} />
      ) : (
        <TaskDetailForm task={state.task} projects={context.projects} onDone={context.close} />
      )}
    </aside>
  )
}
