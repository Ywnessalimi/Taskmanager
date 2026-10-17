"use client"

import { useT } from "@/components/providers/locale-provider"
import { MobileCreateMenu } from "@/features/tasks/mobile-create-menu"
import { RemixIcon } from "@/components/ui/remix-icon"
import { BoardView } from "@/features/projects/views/board-view"
import { CalendarView } from "@/features/projects/views/calendar-view"
import { TableView } from "@/features/projects/views/table-view"
import { TimelineView } from "@/features/projects/views/timeline-view"
import { TreeView } from "@/features/projects/views/tree-view"
import type { TaskViewId } from "@/features/projects/view-switcher"
import type { Member, Project, Task } from "@/lib/api/types"

/** محتوای پنج نمای پروژه؛ انتخاب نما در نوار یکپارچهٔ ProjectSectionTabs انجام می‌شود. */
export function ProjectTaskList({ project, tasks = project?.tasks ?? [], today, view, ticketAssignees }: { project?: Project; tasks?: Task[]; today: string; view: TaskViewId; ticketAssignees?: Member[] }) {
  const t = useT()

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {project && view === "board" && <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 text-sm">
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--project-filter-bg)] px-3 py-1 text-[var(--project-filter-fg)]"><RemixIcon name="stack-line" />{t("projects.grouping")}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--project-filter-bg)] px-3 py-1 text-[var(--project-filter-fg)]"><RemixIcon name="filter-line" />{t("projects.filters")}</span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-text3"><RemixIcon name="git-branch-line" />{t("projects.subtasks")}</span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-text3"><RemixIcon name="filter-3-line" />{t("projects.moreFilters")}</span>
      </div>}

      {view === "tree" && <TreeView tasks={tasks} projectId={project?.id} />}
      {view === "board" && <BoardView key={project?.id ?? "my-tasks"} tasks={tasks} projectId={project?.id} figmaStyle includeTickets={!project} ticketAssignees={ticketAssignees} />}
      <MobileCreateMenu projectId={project?.id} />
      {view === "table" && <TableView tasks={tasks} showProject={!project} />}
      {view === "timeline" && (
        <TimelineView tasks={tasks} today={today} />
      )}
      {view === "calendar" && <CalendarView tasks={tasks} />}
    </div>
  )
}
