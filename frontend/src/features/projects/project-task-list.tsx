"use client"

import { useState } from "react"
import { useT } from "@/components/providers/locale-provider"
import { useTaskPanel } from "@/components/providers/task-panel-provider"
import { MobileCreateMenu } from "@/features/tasks/mobile-create-menu"
import { RemixIcon } from "@/components/ui/remix-icon"
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BoardView } from "@/features/projects/views/board-view"
import { CalendarView } from "@/features/projects/views/calendar-view"
import { TableView } from "@/features/projects/views/table-view"
import { TimelineView } from "@/features/projects/views/timeline-view"
import { TreeView } from "@/features/projects/views/tree-view"
import { PRIORITY_COLOR } from "@/features/projects/task-display"
import type { TaskViewId } from "@/features/projects/view-switcher"
import type { Member, Project, Task } from "@/lib/api/types"

type Grouping = "status" | "priority" | "assignee"

function GroupedTasks({ tasks, grouping }: { tasks: Task[]; grouping: Exclude<Grouping, "status"> }) {
  const t = useT()
  const panel = useTaskPanel()
  const groups = grouping === "priority"
    ? (["urgent", "high", "medium", "low", "none"] as const).map((priority) => ({ key: priority, label: t(({ urgent: "priority.urgent", high: "priority.high", medium: "priority.medium", low: "priority.low", none: "priority.none" } as const)[priority]), color: PRIORITY_COLOR[priority], tasks: tasks.filter((task) => (task.priority ?? "none") === priority) }))
    : Array.from(new Set(tasks.flatMap((task) => task.assigneeNames?.length ? [task.assigneeNames[0]] : ["__unassigned__"]))).sort().map((name) => ({ key: name, label: name === "__unassigned__" ? t("newTask.unselected") : name, tasks: tasks.filter((task) => (task.assigneeNames?.[0] ?? "__unassigned__") === name) }))
  return <div className="-mx-4 overflow-x-auto px-4 pb-2"><div className="flex w-max min-w-full items-start gap-3">{groups.map((group) => <section key={group.key} className="w-[min(297px,80vw)] shrink-0 overflow-hidden rounded-lg border border-border bg-background" style={"color" in group ? { backgroundColor: `color-mix(in srgb, ${group.color} 8%, white)` } : undefined}><h3 className="flex min-h-11 items-center justify-between border-b border-border px-3 py-2 text-sm font-medium"><span className="truncate">{group.label}</span><span className="text-xs text-text3">{group.tasks.length}</span></h3><div className="flex min-h-20 flex-col gap-2 p-2">{group.tasks.length ? group.tasks.map((task) => <button key={task.id} type="button" onClick={() => panel?.openTaskDetail(task)} className="block w-full truncate rounded-lg border border-border bg-background px-3 py-3 text-start text-sm hover:bg-bg2">{task.title}</button>) : <p className="px-2 py-3 text-xs text-text3">—</p>}</div></section>)}</div></div>
}

/** محتوای پنج نمای پروژه؛ انتخاب نما در نوار یکپارچهٔ ProjectSectionTabs انجام می‌شود. */
export function ProjectTaskList({ project, tasks = project?.tasks ?? [], today, view, ticketAssignees }: { project?: Project; tasks?: Task[]; today: string; view: TaskViewId; ticketAssignees?: Member[] }) {
  const t = useT()
  const [grouping, setGrouping] = useState<Grouping>("status")

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {project && view === "board" && <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 text-sm">
        <DropdownMenu><DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-full bg-[var(--project-filter-bg)] px-3 py-1 text-[var(--project-filter-fg)]"><RemixIcon name="stack-line" />{t("projects.grouping")}: {t(({status:"projects.groupByStatus",priority:"projects.groupByPriority",assignee:"projects.groupByAssignee"} as const)[grouping])}</DropdownMenuTrigger><DropdownMenuContent align="start"><DropdownMenuRadioGroup value={grouping} onValueChange={(value) => setGrouping(value as Grouping)}><DropdownMenuRadioItem value="status">{t("projects.groupByStatus")}</DropdownMenuRadioItem><DropdownMenuRadioItem value="priority">{t("projects.groupByPriority")}</DropdownMenuRadioItem><DropdownMenuRadioItem value="assignee">{t("projects.groupByAssignee")}</DropdownMenuRadioItem></DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu>
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--project-filter-bg)] px-3 py-1 text-[var(--project-filter-fg)]"><RemixIcon name="filter-line" />{t("projects.filters")}</span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-text3"><RemixIcon name="git-branch-line" />{t("projects.subtasks")}</span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-text3"><RemixIcon name="filter-3-line" />{t("projects.moreFilters")}</span>
      </div>}

      {view === "tree" && <TreeView tasks={tasks} projectId={project?.id} />}
      {view === "board" && (grouping === "status" ? <BoardView key={project?.id ?? "my-tasks"} tasks={tasks} projectId={project?.id} figmaStyle includeTickets ticketAssignees={ticketAssignees} /> : <GroupedTasks tasks={tasks} grouping={grouping} />)}
      <MobileCreateMenu projectId={project?.id} />
      {view === "table" && <TableView tasks={tasks} showProject={!project} />}
      {view === "timeline" && (
        <TimelineView tasks={tasks} today={today} />
      )}
      {view === "calendar" && <CalendarView tasks={tasks} />}
    </div>
  )
}
