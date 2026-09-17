"use client"

import { useMemo, useState } from "react"
import { useT } from "@/components/providers/locale-provider"
import { BoardView } from "@/features/projects/views/board-view"
import { CalendarView } from "@/features/projects/views/calendar-view"
import { TableView } from "@/features/projects/views/table-view"
import { TimelineView } from "@/features/projects/views/timeline-view"
import { TreeView } from "@/features/projects/views/tree-view"
import { ViewSwitcher, type TaskViewId } from "@/features/projects/view-switcher"
import type { MyTask } from "@/lib/api/types"
import { ALL_PROJECTS, useMyTasksFilter } from "./my-tasks-filter-provider"

/**
 * لیست تب «تسک‌های من»: همان ۵ نمای پروژه، اما روی تسک‌های بین‌پروژه‌ای کاربر.
 * چون تسک‌ها از چند پروژه می‌آیند، فیلتر پروژه لازم است — اما به‌جای ردیف دکمه‌ی
 * محلی، از `MyTasksFilterProvider` (کنار عنوان صفحه در `AppHeader`) خوانده می‌شود
 * (نماها خودشان نام پروژه را نشان نمی‌دهند و عمداً دست‌نخورده باقی مانده‌اند).
 */
export function MyTaskList({ tasks, today }: { tasks: MyTask[]; today: string }) {
  const [view, setView] = useState<TaskViewId>("table")
  const { projectId } = useMyTasksFilter()
  const t = useT()

  const visibleTasks = useMemo(
    () => (projectId === ALL_PROJECTS ? tasks : tasks.filter((task) => task.projectId === projectId)),
    [tasks, projectId]
  )

  if (tasks.length === 0) {
    return <p className="py-8 text-center text-sm text-text2">{t("myTasks.empty")}</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <ViewSwitcher view={view} onChange={setView} />

      {view === "tree" && <TreeView tasks={visibleTasks} />}
      {/* key: BoardView وضعیت تسک‌ها را در state خودش نگه می‌دارد، پس با تغییر فیلتر باید ری‌مانت شود */}
      {view === "board" && <BoardView key={projectId} tasks={visibleTasks} />}
      {view === "table" && <TableView tasks={visibleTasks} />}
      {view === "timeline" && <TimelineView tasks={visibleTasks} today={today} />}
      {view === "calendar" && <CalendarView tasks={visibleTasks} />}
    </div>
  )
}
