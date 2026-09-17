"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import type { Task, TaskFormProjectOption } from "@/lib/api/types"

/** پنل باز: یا فرم «تسک جدید» است یا جزئیات یک تسک موجود. */
export type TaskPanelState = { kind: "new" } | { kind: "detail"; task: Task } | null

type TaskPanelContextValue = {
  panel: TaskPanelState
  /** گزینه‌های پروژه/اعضا برای فرم — یک‌بار در لایه‌ی `(tabs)` واکشی می‌شود. */
  projects: TaskFormProjectOption[]
  openNewTask: () => void
  openTaskDetail: (task: Task) => void
  close: () => void
}

const TaskPanelContext = createContext<TaskPanelContextValue | null>(null)

/**
 * وضعیت پنل کناری تسک را بین دو نقطه‌ی دور از هم در درخت کامپوننت‌ها مشترک می‌کند:
 * دکمه‌ی «تسک جدید» در `DesktopHeader` (داخل layout) و ردیف‌های `TreeView` (داخل صفحه)
 * پنل را **باز** می‌کنند، اما خودِ پنل داخل `SectionTabs` رندر می‌شود تا کنار همان باکس
 * لیست/نمای‌کلی بنشیند و آن را جمع کند — نه به‌صورت مودال روی کل صفحه.
 *
 * چون این سه در شاخه‌های مختلف درخت‌اند، Context تنها راه تمیز اشتراک این state است.
 */
export function TaskPanelProvider({
  projects,
  children,
}: {
  projects: TaskFormProjectOption[]
  children: React.ReactNode
}) {
  const [panel, setPanel] = useState<TaskPanelState>(null)

  const openNewTask = useCallback(() => setPanel({ kind: "new" }), [])
  const openTaskDetail = useCallback((task: Task) => setPanel({ kind: "detail", task }), [])
  const close = useCallback(() => setPanel(null), [])

  const value = useMemo(
    () => ({ panel, projects, openNewTask, openTaskDetail, close }),
    [panel, projects, openNewTask, openTaskDetail, close]
  )

  return <TaskPanelContext.Provider value={value}>{children}</TaskPanelContext.Provider>
}

/**
 * اگر بیرون از Provider صدا زده شود `null` برمی‌گرداند (نه خطا) — چون `TreeView` در
 * صفحه‌هایی هم استفاده می‌شود که ممکن است پنل نداشته باشند؛ آنجا کلیک روی تسک بی‌اثر می‌ماند.
 */
export function useTaskPanel(): TaskPanelContextValue | null {
  return useContext(TaskPanelContext)
}
