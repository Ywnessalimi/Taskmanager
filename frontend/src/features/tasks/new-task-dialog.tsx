"use client"

import { useEffect, useRef, useState } from "react"
import { useT } from "@/components/providers/locale-provider"
import { Button } from "@/components/ui/button"
import { DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DatePickerDialog } from "@/components/ui/date-picker-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PriorityDot } from "@/features/projects/task-display"
import { AssigneePickerDialog } from "./assignee-picker-dialog"
import { TagPickerDialog } from "./tag-picker-dialog"
import { useTaskTimer } from "./time-tracking"
import { NewTaskActivity } from "./new-task-activity"
import { NewTaskAsset, type NewTaskAssetName } from "./new-task-assets"
import { RepeatPicker } from "./repeat-picker"
import { saveTaskDetails } from "./local-task-details"
import { createTask } from "@/lib/api/tasks"
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

/** فرم مستقل ساخت تسک در قاب Figma 1722:29819؛ پروژهٔ جاری پیش‌فرض است و پس از بستن reset می‌شود. */
export function NewTaskDialog({ projects, defaultProjectId, user, onDone, task }: {
  projects: TaskFormProjectOption[]
  defaultProjectId?: string
  user: CurrentUser
  task?: Task
  onDone: () => void
}) {
  const t = useT()
  const [projectId, setProjectId] = useState(defaultProjectId ?? projects[0]?.id ?? "")
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
  const [subtasks, setSubtasks] = useState<string[]>(task?.subtasks?.map(item=>item.title) ?? [])
  const [subtaskTitle, setSubtaskTitle] = useState("")
  const [recurrence,setRecurrence]=useState<TaskRecurrence>(task?.recurrence ?? {dates:[],count:1})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(false)
  const [showActivities, setShowActivities] = useState(false)
  const timer = useTaskTimer(minutes, setMinutes)
  const fileInput = useRef<HTMLInputElement>(null)
  const lastSaved = useRef<string | null>(null)
  const project = projects.find((option) => option.id === projectId)
  const selectedPriority = PRIORITIES.find((option) => option.value === priority)!
  const unset = t("newTask.unselected")

  useEffect(()=>{
    if(!task)return
    const updated:Task={...task,title,description,startDate,dueDate,priority,status,tags,assigneeNames,isFavorite:favorite,followers:following?[...new Set([...(task.followers??[]),user.name])]:(task.followers??[]).filter(name=>name!==user.name),timeSpentMinutes:minutes,recurrence,subtasks:subtasks.map((name,index)=>({...task.subtasks?.[index],id:task.subtasks?.[index]?.id??`${task.id}-sub-${index}`,displayId:task.subtasks?.[index]?.displayId??"",title:name,priority:task.subtasks?.[index]?.priority??"none",status:task.subtasks?.[index]?.status??"todo"}))}
    const signature=JSON.stringify(updated)
    if(lastSaved.current===null){lastSaved.current=signature;return}
    if(lastSaved.current===signature)return
    void Promise.resolve().then(()=>{saveTaskDetails(updated);lastSaved.current=signature}).catch(()=>setError(true))
  },[task,title,description,startDate,dueDate,priority,status,tags,assigneeNames,favorite,following,minutes,recurrence,subtasks,user.name])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!title.trim() || !projectId || submitting) return
    setSubmitting(true)
    setError(false)
    try {
      await createTask({ recurrence, title: title.trim(), projectId, priority, tags, startDate: startDate || undefined, dueDate: dueDate || undefined, assigneeNames, description: description.trim() || undefined, status, followers: following ? [user.name] : [], isFavorite: favorite, timeSpentMinutes: minutes + Math.ceil(timer.elapsedSeconds / 60), subtasks: subtasks.map((title) => ({ title })) })
      onDone()
    } catch {
      setError(true)
      setSubmitting(false)
    }
  }

  function addSubtask() {
    if (!subtaskTitle.trim()) return
    setSubtasks((previous) => [...previous, subtaskTitle.trim()])
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
          <DropdownMenu>
            <DropdownMenuTrigger className="flex min-w-0 items-center gap-1 text-[var(--task-workspace-secondary)]" aria-label={t("taskForm.project")}>
              <NewTaskAsset name="list-check3" /><span className="max-w-64 truncate">{project?.name ?? t("taskForm.project")}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuRadioGroup value={projectId} onValueChange={(value) => { setProjectId(value); setAssigneeNames([]) }}>
                {projects.map((option) => <DropdownMenuRadioItem key={option.id} value={option.id}>{option.name}</DropdownMenuRadioItem>)}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <DialogClose aria-label={t("taskDetail.close")} className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--task-workspace-soft)]"><NewTaskAsset name="close-fill" /></DialogClose>
      </div>
      <div className="flex shrink-0 border-b border-border lg:hidden">
        <button type="button" onClick={() => setShowActivities(false)} aria-pressed={!showActivities} className={`flex-1 py-2 ${!showActivities ? "border-b-2 border-brand" : ""}`}>{t("taskDetail.title")}</button>
        <button type="button" onClick={() => setShowActivities(true)} aria-pressed={showActivities} className={`flex-1 py-2 ${showActivities ? "border-b-2 border-brand" : ""}`}>{t("newTask.activities")}</button>
      </div>
      {task && error && <p role="alert" className="p-2 text-error">{t("newTask.submitError")}</p>}
      <div className="flex min-h-0 flex-1">
        <form onSubmit={submit} className={`${showActivities ? "hidden lg:flex" : "flex"} min-w-0 flex-1 flex-col`}>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 sm:px-6">
            <div className="flex min-h-13 items-center justify-between gap-2 pt-3">
              <span className="text-sm text-[var(--task-workspace-muted)]">{task ? task.displayId : t("nav.newTask")}</span>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" disabled className="flex h-8 items-center gap-1 rounded-lg border border-border px-1.5 text-xs text-[var(--task-workspace-secondary)]"><NewTaskAsset name="git-merge-line" />{t("newTask.noMilestone")}</button>
                <button type="button" aria-pressed={following} onClick={() => setFollowing(!following)} className={`flex h-8 items-center gap-1 rounded-lg border border-border px-1.5 text-xs ${following ? "bg-bg2" : ""}`}><NewTaskAsset name="eye-line" />{t(following ? "newTask.following" : "newTask.follow")}</button>
                <button type="button" aria-label={t("taskDetail.favorite")} aria-pressed={favorite} onClick={() => setFavorite(!favorite)} className={`flex size-8 items-center justify-center rounded-lg border border-border ${favorite ? "bg-bg2" : ""}`}><NewTaskAsset name="heart3-line" /></button>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2.5 pb-4">
              <DropdownMenu>
                <DropdownMenuTrigger aria-label={t("newTask.status")} className="flex items-center gap-1"><NewTaskAsset name="frame122" />{status !== "todo" && <span className="text-xs text-text2">{t(status === "completed" ? "status.completed" : "status.inProgress")}</span>}</DropdownMenuTrigger>
                <DropdownMenuContent><DropdownMenuRadioGroup value={status} onValueChange={(value) => setStatus(value as TaskStatus)}><DropdownMenuRadioItem value="todo">{t("status.todo")}</DropdownMenuRadioItem><DropdownMenuRadioItem value="in-progress">{t("status.inProgress")}</DropdownMenuRadioItem><DropdownMenuRadioItem value="completed">{t("status.completed")}</DropdownMenuRadioItem></DropdownMenuRadioGroup></DropdownMenuContent>
              </DropdownMenu>
              <input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t("taskForm.titlePlaceholder")} aria-label={t("taskForm.titlePlaceholder")} className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none placeholder:text-[var(--task-workspace-muted)]" />
            </div>
            {!project && <p className="py-2 text-text2">{t("taskForm.noProjects")}</p>}
            <div className="grid grid-cols-1 gap-4 pb-4 min-[850px]:grid-cols-2 min-[850px]:gap-6">
              <div className="flex flex-col gap-3">
                <DatePickerDialog value={startDate} onChange={setStartDate} trigger={<DialogTrigger className={FIELD_CLASS}><FieldLabel icon="calendar-todo-line" label={t("newTask.startDate")} /><span className="truncate text-[13px] text-[var(--task-workspace-muted)]">{startDate || unset}</span></DialogTrigger>} />
                <DatePickerDialog value={dueDate} onChange={setDueDate} trigger={<DialogTrigger className={FIELD_CLASS}><FieldLabel icon="calendar-check-line" label={t("newTask.dueDate")} /><span className="truncate text-[13px] text-[var(--task-workspace-muted)]">{dueDate || unset}</span></DialogTrigger>} />
                <AssigneePickerDialog members={project?.members ?? []} assigneeNames={assigneeNames} onChange={setAssigneeNames} trigger={<DialogTrigger className={FIELD_CLASS}><FieldLabel icon="team-line" label={t("newTask.members")} /><span className="truncate text-[13px] text-[var(--task-workspace-muted)]">{assigneeNames.join("، ") || unset}</span></DialogTrigger>} />
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
            <div className="pb-4"><RepeatPicker value={recurrence} onChange={setRecurrence} /></div>
            <div className="overflow-hidden"><NewTaskAsset name="line11" /></div>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t("taskForm.descriptionPlaceholder")} aria-label={t("taskForm.descriptionPlaceholder")} className="h-25 w-full resize-y bg-transparent pt-2 text-sm outline-none placeholder:text-[var(--task-workspace-muted)]" />
            <div className="border-t border-[var(--task-workspace-border)] py-3">
              <button type="button" onClick={() => fileInput.current?.click()} className="flex items-center gap-2 text-[var(--task-workspace-muted)]"><NewTaskAsset name="attachment2" />{t("taskForm.attachFile")}</button>
              <input ref={fileInput} type="file" multiple className="hidden" onChange={(event) => setFiles((previous) => [...new Set([...previous, ...Array.from(event.target.files ?? []).map((file) => file.name)])])} />
              {files.map((file) => <button key={file} type="button" onClick={() => setFiles((previous) => previous.filter((name) => name !== file))} aria-label={`${t("newTask.removeAttachment")} ${file}`} className="mt-2 block max-w-full truncate rounded bg-bg2 px-2 py-1 text-xs">{file} ×</button>)}
            </div>
            <details className="border-y border-[var(--task-workspace-border)]">
              <summary className="flex cursor-pointer list-none items-center gap-2 py-3 text-[var(--task-workspace-muted)]"><NewTaskAsset name="git-branch-line" />{t("taskDetail.subtasks")}<NewTaskAsset name="arrow-down-sline" className="ms-auto" /></summary>
              <div className="pb-3">
                {subtasks.map((item, index) => <div key={`${index}-${item}`} className="flex items-center gap-2 py-2"><span className="size-3 rounded-full border border-border" /><span>{item}</span><button type="button" className="ms-auto" aria-label={t("newTask.removeSubtask")} onClick={() => setSubtasks((previous) => previous.filter((_, i) => i !== index))}>×</button></div>)}
                <div className="flex gap-2"><input value={subtaskTitle} onChange={(event) => setSubtaskTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSubtask() } }} placeholder={t("newTask.subtaskPlaceholder")} aria-label={t("newTask.subtaskPlaceholder")} className="min-w-0 flex-1 rounded border border-border px-2 py-1 outline-none" /><Button type="button" variant="ghost" onClick={addSubtask} disabled={!subtaskTitle.trim()}>{t("projectTabs.add")}</Button></div>
              </div>
            </details>
            <details className="border-b border-[var(--task-workspace-border)]">
              <summary className="flex cursor-pointer list-none items-center gap-2 py-3 text-[var(--task-workspace-muted)]"><NewTaskAsset name="history-line" />{t("newTask.history")}<NewTaskAsset name="arrow-down-sline" className="ms-auto" /></summary>
              {task?.activityLog?.length ? <div className="divide-y divide-border">{task.activityLog.map(entry=><p key={entry.id} className="py-2 text-xs text-text2">{entry.message}<span className="ms-2 text-text3">{entry.date}</span></p>)}</div> : <p className="pb-3 text-xs text-[var(--task-workspace-muted)]">{t("taskDetail.noActivity")}</p>}
            </details>
          </div>
          {!task && <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--task-workspace-border)] p-3">
            {error && <p role="alert" className="me-auto text-xs text-error">{t("newTask.submitError")}</p>}
            <Button type="button" variant="ghost" onClick={onDone}>{t("taskForm.cancel")}</Button>
            <Button type="submit" disabled={!title.trim() || !projectId || submitting} className="bg-[var(--mini-bar-bg)] text-white">{t("taskForm.submit")}</Button>
          </footer>}
        </form>
        <div className={`${showActivities ? "flex" : "hidden lg:flex"} min-h-0 flex-1 flex-col lg:flex-none`}>
          <NewTaskActivity user={user} members={project?.members ?? []} following={following} onFollowingChange={setFollowing} />
        </div>
      </div>
    </DialogContent>
  )
}
