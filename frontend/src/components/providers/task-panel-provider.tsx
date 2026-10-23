"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import type { CurrentUser, Task, TaskFormProjectOption } from "@/lib/api/types"

/** پنل باز: یا فرم «تسک جدید» است یا جزئیات یک تسک موجود. */
export type TaskPanelState = { kind: "new"; projectId?: string } | { kind: "detail"; task: Task; parentTask?: Task } | null

type TaskPanelContextValue = {
  user: CurrentUser
  updateUser: (user: CurrentUser) => void
  panel: TaskPanelState
  /** گزینه‌های پروژه/اعضا برای فرم — یک‌بار در لایه‌ی `(tabs)` واکشی می‌شود. */
  projects: TaskFormProjectOption[]
  openNewTask: (projectId?: string) => void
  openTaskDetail: (task: Task, parentTask?: Task) => void
  close: () => void
}

const TaskPanelContext = createContext<TaskPanelContextValue | null>(null)

/** وضعیت مشترک مودال تسک؛ میزبان TaskPanel در صفحهٔ پروژه یا تسک‌های من است. */
export function TaskPanelProvider({
  projects,
  user,
  children,
}: {
  projects: TaskFormProjectOption[]
  user: CurrentUser
  children: React.ReactNode
}) {
  const [panel, setPanel] = useState<TaskPanelState>(null)
  const [currentUser, setCurrentUser] = useState(user)

  const openNewTask = useCallback((projectId?: string) => setPanel({ kind: "new", projectId }), [])
  const openTaskDetail = useCallback((task: Task, parentTask?: Task) => setPanel({ kind: "detail", task, parentTask }), [])
  const close = useCallback(() => setPanel(null), [])
  const updateUser = useCallback((nextUser: CurrentUser) => setCurrentUser(nextUser), [])

  const value = useMemo(
    () => ({ user: currentUser, updateUser, panel, projects, openNewTask, openTaskDetail, close }),
    [currentUser, updateUser, panel, projects, openNewTask, openTaskDetail, close]
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
