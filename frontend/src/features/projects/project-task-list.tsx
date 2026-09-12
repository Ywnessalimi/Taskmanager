"use client"

import { useState } from "react"
import { BoardView } from "@/features/projects/views/board-view"
import { CalendarView } from "@/features/projects/views/calendar-view"
import { TableView } from "@/features/projects/views/table-view"
import { TimelineView } from "@/features/projects/views/timeline-view"
import { TreeView } from "@/features/projects/views/tree-view"
import { ViewSwitcher, type TaskViewId } from "@/features/projects/view-switcher"
import type { Project } from "@/lib/api/types"

/** بخش List پروژه: سوییچر ۵ نما — همه‌شان واقعاً پیاده شده‌اند. */
export function ProjectTaskList({ project, today }: { project: Project; today: string }) {
  const [view, setView] = useState<TaskViewId>("table")

  return (
    <div className="flex flex-col gap-3">
      <ViewSwitcher view={view} onChange={setView} />

      {view === "tree" && <TreeView tasks={project.tasks} />}
      {view === "board" && <BoardView tasks={project.tasks} />}
      {view === "table" && <TableView tasks={project.tasks} />}
      {view === "timeline" && (
        <TimelineView tasks={project.tasks} today={today} />
      )}
      {view === "calendar" && <CalendarView tasks={project.tasks} />}
    </div>
  )
}
