"use client"

import { useMemo, useState } from "react"
import { BoardView } from "@/features/projects/views/board-view"
import { CalendarView } from "@/features/projects/views/calendar-view"
import { TableView } from "@/features/projects/views/table-view"
import { TimelineView } from "@/features/projects/views/timeline-view"
import { TreeView } from "@/features/projects/views/tree-view"
import { ViewSwitcher, type TaskViewId } from "@/features/projects/view-switcher"
import type { MyTask } from "@/lib/api/types"

const ALL_PROJECTS = "all"

/**
 * لیست تب «تسک‌های من»: همان ۵ نمای پروژه، اما روی تسک‌های بین‌پروژه‌ای کاربر.
 * چون تسک‌ها از چند پروژه می‌آیند، یک فیلتر پروژه بالای سوییچر نما اضافه شده
 * (نماها خودشان نام پروژه را نشان نمی‌دهند و عمداً دست‌نخورده باقی مانده‌اند).
 */
export function MyTaskList({ tasks, today }: { tasks: MyTask[]; today: string }) {
  const [view, setView] = useState<TaskViewId>("table")
  const [projectId, setProjectId] = useState<string>(ALL_PROJECTS)

  const projects = useMemo(() => {
    const seen = new Map<string, string>()
    for (const task of tasks) seen.set(task.projectId, task.projectName)
    return [...seen.entries()].map(([id, name]) => ({ id, name }))
  }, [tasks])

  const visibleTasks = useMemo(
    () => (projectId === ALL_PROJECTS ? tasks : tasks.filter((task) => task.projectId === projectId)),
    [tasks, projectId]
  )

  if (tasks.length === 0) {
    return <p className="py-8 text-center text-sm text-text2">تسک در حال انجامی به شما تخصیص داده نشده.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 overflow-x-auto">
        {[{ id: ALL_PROJECTS, name: "همه‌ی پروژه‌ها" }, ...projects].map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => setProjectId(project.id)}
            className={`shrink-0 rounded-md border px-2.5 py-1 text-xs ${
              projectId === project.id
                ? "border-border bg-background text-foreground"
                : "border-transparent text-text2 hover:text-foreground"
            }`}
          >
            {project.name}
          </button>
        ))}
      </div>

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
