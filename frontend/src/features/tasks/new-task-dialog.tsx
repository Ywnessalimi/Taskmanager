"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import { useT } from "@/components/providers/locale-provider"
import { RemixIcon } from "@/components/ui/remix-icon"
import { Button } from "@/components/ui/button"
import { DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DatePickerDialog } from "@/components/ui/date-picker-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PriorityDot } from "@/features/projects/task-display"
import { readTaskBoardColumnAssignments, writeTaskBoardColumnAssignment } from "@/features/projects/board-column-storage"
import { AssigneePickerDialog } from "./assignee-picker-dialog"
import { TagPickerDialog } from "./tag-picker-dialog"
import { useTaskTimer } from "./time-tracking"
import { NewTaskActivity } from "./new-task-activity"
import { NewTaskAsset, type NewTaskAssetName } from "./new-task-assets"
import { RepeatPicker } from "./repeat-picker"
import { TaskStatusPicker } from "./task-status-picker"
import { saveTaskDetails } from "./local-task-details"
import { createTask, getTask, updateTask } from "@/lib/api/tasks"
import type { Task, TaskRecurrence, CurrentUser, TaskFormProjectOption, TaskPriority, TaskStatus } from "@/lib/api/types"
import type { TranslationKey } from "@/lib/i18n/dictionary"

const PRIORITIES: { value: TaskPriority; label: TranslationKey }[] = [
  { value: "none", label: "priority.none" }, { value: "low", label: "priority.low" },
  { value: "medium", label: "priority.medium" }, { value: "high", label: "priority.high" },
  { value: "urgent", label: "priority.urgent" },
]

const FIELD_CLASS = "flex w-full min-w-0 items-center gap-3 rounded-md py-1 text-start hover:bg-bg2"

function FieldLabel({ icon, label }: { icon: NewTaskAssetName; label: string }) {
  return <span className="flex w-30 shrink-0 items-center gap-1.5 text-[13px] text-[var(--task-workspace-muted)]"><NewTaskAsset name={icon} /><span>{label}</span></span>
}

/** یک قاب مشترک برای تسک و زیرتسک؛ جابه‌جایی بین آن‌ها قاب مودال را نمی‌بندد. */
export function NewTaskDialog({ projects, defaultProjectId, user, onDone, task, initialSubtaskId }: {
  projects: TaskFormProjectOption[]
  defaultProjectId?: string
  user: CurrentUser
  task?: Task
  initialSubtaskId?: string
  onDone: () => void
}) {
  const [rootTask, setRootTask] = useState(task)
  const [activeSubtaskId, setActiveSubtaskId] = useState<string | null>(initialSubtaskId ?? null)
  const subtask = activeSubtaskId ? rootTask?.subtasks?.find((item) => item.id === activeSubtaskId) : undefined
  const activeTask = subtask && rootTask ? { ...subtask, projectId: rootTask.projectId } : rootTask

  return <TaskWorkspaceEditor
    key={activeSubtaskId ?? rootTask?.id ?? "new"}
    projects={projects}
    defaultProjectId={defaultProjectId}
    user={user}
    onDone={onDone}
    task={activeTask}
    parentTask={subtask ? rootTask : undefined}
    onRootUpdated={setRootTask}
    onOpenSubtask={setActiveSubtaskId}
    onBackToParent={() => setActiveSubtaskId(null)}
  />
}

/** فرم ساخت/ویرایش در قاب Figma 1722:29819. */
function TaskWorkspaceEditor({ projects, defaultProjectId, user, onDone, task, parentTask, onRootUpdated, onOpenSubtask, onBackToParent }: {
  projects: TaskFormProjectOption[]
  defaultProjectId?: string
  user: CurrentUser
  task?: Task
  parentTask?: Task
  onDone: () => void
  onRootUpdated: (task: Task) => void
  onOpenSubtask: (id: string) => void
  onBackToParent: () => void
}) {
  const t = useT()
  const router = useRouter()
  const [projectId, setProjectId] = useState(task?.projectId ?? defaultProjectId ?? projects[0]?.id ?? "")
  const [title, setTitle] = useState(task?.title ?? "")
  const [description, setDescription] = useState(task?.description ?? "")
  const [startDate, setStartDate] = useState(task?.startDate ?? "")
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "")
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "none")
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "todo")
  const [tags, setTags] = useState<string[]>(task?.tags ?? [])
  const [assigneeNames, setAssigneeNames] = useState<string[]>(task?.assigneeNames ?? [])
  const [favorite, setFavorite] = useState(task?.isFavorite ?? false)
  const [following, setFollowing] = useState(task?.followers?.includes(user.name) ?? false)
  const [minutes, setMinutes] = useState(task?.timeSpentMinutes ?? 0)
  const [files, setFiles] = useState<string[]>([])
  const [subtasks, setSubtasks] = useState<Task[]>(task?.subtasks ?? [])
  const [subtaskTitle, setSubtaskTitle] = useState("")
  const [columnOverride, setColumnOverride] = useState<{ projectId: string; id: string } | null>(null)
  const [recurrence,setRecurrence]=useState<TaskRecurrence>(task?.recurrence ?? {dates:[],count:1})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(false)
  const [failedSignature, setFailedSignature] = useState<string | null>(null)
  const [showActivities, setShowActivities] = useState(false)
  const timer = useTaskTimer(minutes, setMinutes)
  const fileInput = useRef<HTMLInputElement>(null)
  const [savedTaskSignature, setSavedTaskSignature] = useState(() => task ? JSON.stringify([
    task.projectId, task.title, task.description ?? "", task.startDate ?? "", task.dueDate ?? "", task.priority, task.status,
    task.tags ?? [], task.assigneeNames ?? [], task.isFavorite ?? false, task.followers?.includes(user.name) ?? false,
    task.timeSpentMinutes ?? 0, task.recurrence ?? { dates: [], count: 1 }, task.subtasks ?? [],
  ]) : null)
  const project = projects.find((option) => option.id === projectId)
  const selectedPriority = PRIORITIES.find((option) => option.value === priority)!
  const unset = t("newTask.unselected")

  const initialColumnId = useSyncExternalStore(
    (notify) => {
      window.addEventListener("quire:task-board-columns-changed", notify)
      window.addEventListener("storage", notify)
      return () => {
        window.removeEventListener("quire:task-board-columns-changed", notify)
        window.removeEventListener("storage", notify)
      }
    },
    () => {
      const assignment = task && projectId ? readTaskBoardColumnAssignments()[task.id] : undefined
      return assignment?.projectId === projectId ? assignment.columnId : task?.status ?? "todo"
    },
    () => task?.status ?? "todo",
  )
  const selectedColumnId = columnOverride?.projectId === projectId ? columnOverride.id : initialColumnId

  const currentTaskSignature = JSON.stringify([
    projectId, title, description, startDate, dueDate, priority, status, tags, assigneeNames, favorite, following,
    minutes, recurrence, subtasks,
  ])
  const hasTaskChanges = Boolean(task && (currentTaskSignature !== savedTaskSignature || selectedColumnId !== initialColumnId))

  async function saveChanges() {
    if (!task) return false
    if (!hasTaskChanges) return true
    if (submitting || !title.trim() || !projectId) return false
    setSubmitting(true)
    setError(false)
    const updated: Task = {
      ...task, projectId, title: title.trim(), description, startDate, dueDate, priority, status, tags, assigneeNames,
      isFavorite: favorite,
      followers: following ? [...new Set([...(task.followers ?? []), user.name])] : (task.followers ?? []).filter(name => name !== user.name),
      timeSpentMinutes: minutes, recurrence,
      ...(parentTask ? {} : { subtasks }),
    }
    try {
      const latest = await getTask(parentTask?.id ?? task.id)
      if (!latest) throw new Error("Task not found")
      if (parentTask && !latest.subtasks?.some((item) => item.id === updated.id)) throw new Error("Subtask not found")
      const root = parentTask
        ? { ...latest, subtasks: latest.subtasks?.map((item) => item.id === updated.id ? updated : item) ?? [] }
        : {
          ...updated,
          subtasks: [
            ...(latest.subtasks ?? []).filter((item) => !(task.subtasks ?? []).some((visible) => visible.id === item.id)),
            ...subtasks,
          ],
        }
      const saved = await updateTask({ id: root.id, projectId: root.projectId, title: root.title, description: root.description, startDate: root.startDate, dueDate: root.dueDate, priority: root.priority, status: root.status, tags: root.tags ?? [], assigneeNames: root.assigneeNames, followers: root.followers ?? [], isFavorite: root.isFavorite ?? false, timeSpentMinutes: root.timeSpentMinutes ?? 0, recurrence: root.recurrence, repeat: root.repeat, subtasks: root.subtasks }, { id: user.id, name: user.name })
      saveTaskDetails(saved)
      onRootUpdated(saved)
      if (selectedColumnId === "todo" || selectedColumnId === "in-progress" || selectedColumnId === "completed") {
        writeTaskBoardColumnAssignment(task.id)
      } else {
        writeTaskBoardColumnAssignment(task.id, { projectId, columnId: selectedColumnId })
      }
      setSavedTaskSignature(currentTaskSignature)
      setFailedSignature(null)
      setError(false)
      return true
    } catch {
      setError(true)
      setFailedSignature(`${currentTaskSignature}:${selectedColumnId}`)
      return false
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!task || !hasTaskChanges || submitting || !title.trim() || !projectId || failedSignature === `${currentTaskSignature}:${selectedColumnId}`) return
    const timeout = window.setTimeout(() => { void saveChanges() }, 650)
    return () => window.clearTimeout(timeout)
    // saveChanges uses the form snapshot captured by this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, currentTaskSignature, selectedColumnId, hasTaskChanges, submitting, title, projectId, failedSignature])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!title.trim() || !projectId || submitting) return
    setSubmitting(true)
    setError(false)
    try {
      const created = await createTask({ recurrence, title: title.trim(), projectId, priority, tags, startDate: startDate || undefined, dueDate: dueDate || undefined, assigneeNames, description: description.trim() || undefined, status, followers: following ? [user.name] : [], isFavorite: favorite, timeSpentMinutes: minutes + Math.ceil(timer.elapsedSeconds / 60), subtasks: subtasks.map(({ title }) => ({ title })) }, { id: user.id, name: user.name })
      if (selectedColumnId !== "todo" && selectedColumnId !== "in-progress" && selectedColumnId !== "completed") {
        writeTaskBoardColumnAssignment(created.id, { projectId, columnId: selectedColumnId })
      }
      router.refresh()
      onDone()
    } catch {
      setError(true)
      setSubmitting(false)
    }
  }

  function addSubtask() {
    if (!subtaskTitle.trim()) return
    setSubtasks((previous) => [...previous, {
      id: crypto.randomUUID(),
      displayId: task ? `${task.displayId}-${Math.max(0, ...previous.map((item) => Number(item.displayId.split("-").at(-1)) || 0)) + 1}` : "",
      projectId,
      title: subtaskTitle.trim(),
      priority: "none",
      status: "todo",
    }])
    setSubtaskTitle("")
  }

  return (
    <DialogContent variant="taskWorkspace" showCloseButton={false} className="bg-background text-[var(--task-workspace-text)]">
      <DialogTitle className="sr-only">{t(task ? "taskDetail.title" : "taskForm.title")}</DialogTitle>
      <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-[var(--task-workspace-border)] px-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="size-6 shrink-0 rounded-lg bg-[var(--task-workspace-soft)]" />
          <span className="hidden truncate text-sm sm:inline">{project?.organizationName}</span>
          <NewTaskAsset name="line25" className="rotate-[61.7deg]" />
          {parentTask && <>
            <button type="button" onClick={() => { void saveChanges().then((saved) => { if (saved) onBackToParent() }) }} className="max-w-40 truncate text-xs text-brand hover:underline" title={parentTask.title}>{parentTask.title}</button>
            <NewTaskAsset name="line25" className="rotate-[61.7deg]" />
          </>}
          <DropdownMenu>
            <DropdownMenuTrigger disabled={Boolean(parentTask)} className="flex min-w-0 items-center gap-1 text-[var(--task-workspace-secondary)]" aria-label={t("taskForm.project")}>
              <NewTaskAsset name="list-check3" /><span className="max-w-64 truncate">{project?.name ?? t("taskForm.project")}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuRadioGroup value={projectId} onValueChange={(value) => { setProjectId(value); setAssigneeNames([]) }}>
                {projects.map((option) => <DropdownMenuRadioItem key={option.id} value={option.id}>{option.name}</DropdownMenuRadioItem>)}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!task && <Button type="submit" form="task-workspace-form" disabled={!title.trim() || !projectId || submitting} className="h-8 min-w-20 rounded-lg bg-brand px-3 text-xs font-semibold text-white hover:opacity-90">{t("workspace.register")}</Button>}
          <DialogClose aria-label={t("taskDetail.close")} onClick={() => { if (task && hasTaskChanges) void saveChanges() }} className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--task-workspace-soft)]"><NewTaskAsset name="close-fill" /></DialogClose>
        </div>
      </div>
      <div className="flex shrink-0 border-b border-border lg:hidden">
        <button type="button" onClick={() => setShowActivities(false)} aria-pressed={!showActivities} className={`flex-1 py-2 ${!showActivities ? "border-b-2 border-brand" : ""}`}>{t("taskDetail.title")}</button>
        <button type="button" onClick={() => setShowActivities(true)} aria-pressed={showActivities} className={`flex-1 py-2 ${showActivities ? "border-b-2 border-brand" : ""}`}>{t("newTask.activities")}</button>
      </div>
      {error && <p role="alert" className="p-2 text-error">{t("newTask.submitError")}</p>}
      <div className="flex min-h-0 flex-1">
        <form id="task-workspace-form" onSubmit={submit} className={`${showActivities ? "hidden lg:flex" : "flex"} min-w-0 flex-1 flex-col`}>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 sm:px-6">
            <div className="flex min-h-13 items-center justify-between gap-2 pt-3">
              <span className="text-sm text-[var(--task-workspace-muted)]">{task ? task.displayId : t("nav.newTask")}</span>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" disabled className="flex h-8 items-center gap-1 rounded-lg border border-border px-1.5 text-xs text-[var(--task-workspace-secondary)]"><NewTaskAsset name="git-merge-line" />{t("newTask.noMilestone")}</button>
                <button type="button" aria-pressed={following} onClick={() => setFollowing(!following)} className={`flex h-8 items-center gap-1 rounded-lg border border-border px-1.5 text-xs ${following ? "bg-[#141a1a] text-white" : ""}`}><RemixIcon name={following ? "eye-fill" : "eye-line"} />{t(following ? "newTask.following" : "newTask.follow")}</button>
                <button type="button" aria-label={t("taskDetail.favorite")} aria-pressed={favorite} onClick={() => setFavorite(!favorite)} className={`flex size-8 items-center justify-center rounded-lg border border-border ${favorite ? "text-error" : ""}`}><RemixIcon name={favorite ? "heart-fill" : "heart-line"} className="text-base" /></button>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2.5 pb-4">
              <TaskStatusPicker projectId={projectId} projectName={project?.name} selectedColumnId={selectedColumnId} onSelect={(columnId, baseStatus) => { setColumnOverride({ projectId, id: columnId }); if (baseStatus) setStatus(baseStatus) }} />
              <input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t("taskForm.titlePlaceholder")} aria-label={t("taskForm.titlePlaceholder")} className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none placeholder:text-[var(--task-workspace-muted)]" />
            </div>
            {!project && <p className="py-2 text-text2">{t("taskForm.noProjects")}</p>}
            <div className="grid grid-cols-1 gap-4 pb-4 min-[850px]:grid-cols-2 min-[850px]:gap-6">
              <div className="flex flex-col gap-3">
                <DatePickerDialog value={startDate} onChange={setStartDate} trigger={<DialogTrigger className={FIELD_CLASS}><FieldLabel icon="calendar-todo-line" label={t("newTask.startDate")} /><span className="truncate text-[13px] text-[var(--task-workspace-muted)]">{startDate || unset}</span></DialogTrigger>} />
                <DatePickerDialog value={dueDate} onChange={setDueDate} trigger={<DialogTrigger className={FIELD_CLASS}><FieldLabel icon="calendar-check-line" label={t("newTask.dueDate")} /><span className="truncate text-[13px] text-[var(--task-workspace-muted)]">{dueDate || unset}</span></DialogTrigger>} />
                <AssigneePickerDialog members={project?.members ?? []} assigneeNames={assigneeNames} onChange={setAssigneeNames} trigger={<DialogTrigger className={FIELD_CLASS}><FieldLabel icon="team-line" label={t("newTask.members")} /><span className="truncate text-[13px] text-[var(--task-workspace-muted)]">{assigneeNames.join("، ") || unset}</span></DialogTrigger>} />
                <RepeatPicker layout="taskWorkspace" value={recurrence} onChange={setRecurrence} />
              </div>
              <div className="flex flex-col gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger className={FIELD_CLASS}><FieldLabel icon="flag-line" label={t("newTask.priority")} /><span className="flex items-center gap-1 text-[13px] text-[var(--task-workspace-muted)]">{priority !== "none" && <PriorityDot priority={priority} />}{priority === "none" ? unset : t(selectedPriority.label)}</span></DropdownMenuTrigger>
                  <DropdownMenuContent align="start"><DropdownMenuRadioGroup value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>{PRIORITIES.map((option) => <DropdownMenuRadioItem key={option.value} value={option.value}><PriorityDot priority={option.value} />{t(option.label)}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuContent>
                </DropdownMenu>
                <TagPickerDialog tags={tags} onChange={setTags} trigger={<DialogTrigger className={FIELD_CLASS}><FieldLabel icon="price-tag3-line" label={t("newTask.tags")} /><span className="truncate text-[13px] text-[var(--task-workspace-muted)]">{tags.join("، ") || unset}</span></DialogTrigger>} />
                <div className={FIELD_CLASS}><FieldLabel icon="timer-line" label={t("newTask.timeSpent")} /><button type="button" aria-label={t(timer.running ? "taskDetail.stopTimer" : "taskDetail.startTimer")} aria-pressed={timer.running} onClick={timer.toggle} className={timer.running ? "rounded-full bg-bg2" : ""}><NewTaskAsset name="play-circle-fill" /></button>{(timer.running || minutes > 0) && <span className="text-xs tabular-nums" dir="ltr">{minutes + Math.floor(timer.elapsedSeconds / 60)}:{String(timer.elapsedSeconds % 60).padStart(2, "0")}</span>}</div>
              </div>
            </div>
            <div className="overflow-hidden"><NewTaskAsset name="line11" /></div>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t("taskForm.descriptionPlaceholder")} aria-label={t("taskForm.descriptionPlaceholder")} className="h-25 w-full resize-y bg-transparent pt-2 text-sm outline-none placeholder:text-[var(--task-workspace-muted)]" />
            <div className="border-t border-[var(--task-workspace-border)] py-3">
              <button type="button" onClick={() => fileInput.current?.click()} className="flex items-center gap-2 text-[var(--task-workspace-muted)]"><NewTaskAsset name="attachment2" />{t("taskForm.attachFile")}</button>
              <input ref={fileInput} type="file" multiple className="hidden" onChange={(event) => setFiles((previous) => [...new Set([...previous, ...Array.from(event.target.files ?? []).map((file) => file.name)])])} />
              {files.map((file) => <button key={file} type="button" onClick={() => setFiles((previous) => previous.filter((name) => name !== file))} aria-label={`${t("newTask.removeAttachment")} ${file}`} className="mt-2 block max-w-full truncate rounded bg-bg2 px-2 py-1 text-xs">{file} ×</button>)}
            </div>
            {!parentTask && <details className="border-y border-[var(--task-workspace-border)]">
              <summary className="flex cursor-pointer list-none items-center gap-2 py-3 text-[var(--task-workspace-muted)]"><NewTaskAsset name="git-branch-line" />{t("taskDetail.subtasks")}<NewTaskAsset name="arrow-down-sline" className="ms-auto" /></summary>
              <div className="pb-3">
                {subtasks.map((item) => <div key={item.id} className="flex items-center gap-2 border-b border-border/50 py-1 last:border-b-0">
                  <span className="size-3 shrink-0 rounded-full border border-border" />
                  <button type="button" onClick={() => { void saveChanges().then((saved) => { if (saved) onOpenSubtask(item.id) }) }} className="min-w-0 flex-1 truncate rounded-md px-1 py-1.5 text-start text-sm hover:bg-bg2">{item.title}</button>
                  <button type="button" className="shrink-0 rounded-md px-2 text-text3 hover:bg-bg2" aria-label={`${t("newTask.removeSubtask")} ${item.title}`} onClick={() => setSubtasks((previous) => previous.filter((candidate) => candidate.id !== item.id))}>×</button>
                </div>)}
                <div className="flex gap-2"><input value={subtaskTitle} onChange={(event) => setSubtaskTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSubtask() } }} placeholder={t("newTask.subtaskPlaceholder")} aria-label={t("newTask.subtaskPlaceholder")} className="min-w-0 flex-1 rounded border border-border px-2 py-1 outline-none" /><Button type="button" variant="ghost" onClick={addSubtask} disabled={!subtaskTitle.trim()}>{t("projectTabs.add")}</Button></div>
              </div>
            </details>}
          </div>
        </form>
        <div className={`${showActivities ? "flex" : "hidden lg:flex"} min-h-0 flex-1 flex-col lg:flex-none`}>
          <NewTaskActivity user={user} members={project?.members ?? []} following={following} onFollowingChange={setFollowing} />
        </div>
      </div>
    </DialogContent>
  )
}
