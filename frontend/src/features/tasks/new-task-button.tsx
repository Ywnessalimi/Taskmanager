"use client"

import { useT } from "@/components/providers/locale-provider"
import { useTaskPanel } from "@/components/providers/task-panel-provider"
import { RemixIcon } from "@/components/ui/remix-icon"

/**
 * تریگر «تسک جدید» در `DesktopHeader`. قبلاً یک مودال کناری تمام‌ارتفاع (`NewTaskDialog`)
 * باز می‌کرد؛ حالا فقط `TaskPanelProvider` را خبر می‌کند و خودِ فرم داخل `SectionTabs`
 * کنار باکس لیست/نمای‌کلی باز می‌شود (رجوع به `src/features/tasks/README.md`).
 *
 * روی موبایل این دکمه دیده نمی‌شود؛ آنجا `AddTaskFab` به صفحه‌ی کامل `/tasks/new` می‌برد.
 */
export function NewTaskButton() {
  const t = useT()
  const panel = useTaskPanel()

  return (
    <button
      type="button"
      onClick={() => panel?.openNewTask()}
      className="flex h-8 items-center gap-1.5 rounded-md bg-brand px-2.5 text-xs font-medium text-text-on-brand hover:opacity-90"
    >
      <RemixIcon name="add-circle-line" className="text-base" />
      {t("nav.newTask")}
    </button>
  )
}
