"use client"

import { useState } from "react"
import { BoardView } from "@/features/projects/views/board-view"
import { CalendarView } from "@/features/projects/views/calendar-view"
import { TableView } from "@/features/projects/views/table-view"
import { TimelineView } from "@/features/projects/views/timeline-view"
import { TreeView } from "@/features/projects/views/tree-view"
import type { Project } from "@/lib/api/types"

const VIEWS = [
  { id: "tree", label: "درختی" },
  { id: "board", label: "برد" },
  { id: "table", label: "جدول" },
  { id: "timeline", label: "خط زمانی" },
  { id: "calendar", label: "تقویم" },
] as const

type ViewId = (typeof VIEWS)[number]["id"]

/** بخش List پروژه: سوییچر ۵ نما — همه‌شان واقعاً پیاده شده‌اند. */
export function ProjectTaskList({ project }: { project: Project }) {
  const [view, setView] = useState<ViewId>("table")

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 overflow-x-auto">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={`shrink-0 rounded-md px-2.5 py-1 text-xs ${
              view === v.id ? "bg-bg2 text-foreground" : "text-text2 hover:text-foreground"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "tree" && <TreeView tasks={project.tasks} />}
      {view === "board" && <BoardView tasks={project.tasks} />}
      {view === "table" && <TableView tasks={project.tasks} />}
      {view === "timeline" && (
        <TimelineView tasks={project.tasks} startDate={project.startDate} endDate={project.endDate} />
      )}
      {view === "calendar" && <CalendarView tasks={project.tasks} />}
    </div>
  )
}
