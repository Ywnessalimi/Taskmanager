"use client"

import { createContext, useContext, useMemo, useState } from "react"
import type { MyTask } from "@/lib/api/types"

export const ALL_PROJECTS = "all"

type ProjectOption = { id: string; name: string }

type MyTasksFilterContextValue = {
  projectId: string
  setProjectId: (id: string) => void
  projects: ProjectOption[]
}

const MyTasksFilterContext = createContext<MyTasksFilterContextValue | null>(null)

/**
 * فیلتر پروژه‌ی تب «تسک‌های من» را بین `MyTasksProjectSwitcher` (کنار عنوان صفحه در
 * `AppHeader`) و `MyTaskList` (پایین‌تر، داخل `SectionTabs`) مشترک می‌کند — دو نقطه‌ی
 * دور از هم در درخت کامپوننت‌ها، پس Context تنها راه تمیز اشتراک این state است
 * (همان الگوی `TaskPanelProvider`).
 */
export function MyTasksFilterProvider({
  tasks,
  children,
}: {
  tasks: MyTask[]
  children: React.ReactNode
}) {
  const [projectId, setProjectId] = useState<string>(ALL_PROJECTS)

  const projects = useMemo(() => {
    const seen = new Map<string, string>()
    for (const task of tasks) seen.set(task.projectId, task.projectName)
    return [...seen.entries()].map(([id, name]) => ({ id, name }))
  }, [tasks])

  const value = useMemo(() => ({ projectId, setProjectId, projects }), [projectId, projects])

  return <MyTasksFilterContext.Provider value={value}>{children}</MyTasksFilterContext.Provider>
}

/** اگر بیرون از Provider صدا زده شود، فیلتر خاموش می‌ماند (همه‌ی تسک‌ها نشان داده می‌شوند). */
export function useMyTasksFilter(): MyTasksFilterContextValue {
  const ctx = useContext(MyTasksFilterContext)
  return ctx ?? { projectId: ALL_PROJECTS, setProjectId: () => {}, projects: [] }
}
