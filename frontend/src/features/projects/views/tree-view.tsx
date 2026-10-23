"use client"

import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import { useTaskPanel } from "@/components/providers/task-panel-provider"
import { DialogTrigger } from "@/components/ui/dialog"
import { RemixIcon } from "@/components/ui/remix-icon"
import {
  AssigneeField,
  DateField,
  fieldIconTriggerClass,
  pillStyle,
  pillTriggerClass,
  stop,
} from "@/features/projects/views/board-view"
import { PriorityDot, STATUS_LABEL } from "@/features/projects/task-display"
import { TagPickerDialog } from "@/features/tasks/tag-picker-dialog"
import { createTask, getTask, updateTask as persistTask } from "@/lib/api/tasks"
import { saveTaskDetails } from "@/features/tasks/local-task-details"
import { useT } from "@/components/providers/locale-provider"
import type { Task } from "@/lib/api/types"

/** مثل `AssigneeField`/`DateField` در `board-view.tsx` — کلیک روی پیل/آیکون تگ همان `TagPickerDialog` را باز می‌کند. */
function TagsField({ tags, onChange }: { tags: string[]; onChange: (value: string[]) => void }) {
  return (
    <TagPickerDialog
      tags={tags}
      onChange={onChange}
      trigger={
        tags.length > 0 ? (
          <DialogTrigger onPointerDown={stop} onClick={stop} className={pillTriggerClass} style={pillStyle("var(--text3)")}>
            {tags.join("، ")}
          </DialogTrigger>
        ) : (
          <DialogTrigger onPointerDown={stop} onClick={stop} className={fieldIconTriggerClass} aria-label="افزودن تگ">
            <RemixIcon name="price-tag-3-line" className="text-base" />
          </DialogTrigger>
        )
      }
    />
  )
}

function TreeRow({
  task,
  parentTask,
  depth,
  projectId,
  onUpdate,
}: {
  task: Task
  parentTask?: Task
  depth: number
  projectId?: string
  onUpdate: (taskId: string, patch: Partial<Task>) => void
}) {
  const [open, setOpen] = useState(false)
  const [addingSubtask, setAddingSubtask] = useState(false)
  const [subtaskTitle, setSubtaskTitle] = useState("")
  const [savingSubtask, setSavingSubtask] = useState(false)
  const [subtaskError, setSubtaskError] = useState(false)
  const subtaskInputRef = useRef<HTMLInputElement>(null)
  const t = useT()
  const panel = useTaskPanel()
  const hasChildren = Boolean(task.subtasks && task.subtasks.length > 0)

  useEffect(() => {
    if (addingSubtask) subtaskInputRef.current?.focus()
  }, [addingSubtask])

  async function saveNewSubtask(event: FormEvent) {
    event.preventDefault()
    const title = subtaskTitle.trim()
    if (!title || parentTask || !panel || savingSubtask) return
    setSavingSubtask(true)
    setSubtaskError(false)
    try {
      const latest = await getTask(task.id)
      if (!latest) throw new Error("Parent task not found")
      const subtasks = latest.subtasks ?? []
      const nextNumber = Math.max(0, ...subtasks.map((item) => Number(item.displayId.split("-").at(-1)) || 0)) + 1
      const saved = await persistTask({
        id: latest.id,
        projectId: latest.projectId,
        title: latest.title,
        description: latest.description,
        startDate: latest.startDate,
        dueDate: latest.dueDate,
        priority: latest.priority,
        status: latest.status,
        tags: latest.tags ?? [],
        assigneeNames: latest.assigneeNames,
        followers: latest.followers ?? [],
        isFavorite: latest.isFavorite ?? false,
        timeSpentMinutes: latest.timeSpentMinutes ?? 0,
        recurrence: latest.recurrence,
        repeat: latest.repeat,
        subtasks: [...subtasks, {
          id: crypto.randomUUID(),
          displayId: `${latest.displayId}-${nextNumber}`,
          projectId: latest.projectId,
          title,
          priority: "none",
          status: "todo",
          tags: [],
        }],
      }, { id: panel.user.id, name: panel.user.name })
      onUpdate(task.id, { subtasks: saved.subtasks })
      saveTaskDetails(saved)
      setOpen(true)
      setAddingSubtask(false)
      setSubtaskTitle("")
    } catch {
      setSubtaskError(true)
    } finally {
      setSavingSubtask(false)
    }
  }

  /** ردیف فعلاً انتخاب‌شده در پنل — تا کاربر بداند پنل کنار دستش مال کدام تسک است. */
  const selected = panel?.panel?.kind === "detail" && panel.panel.task.id === task.id

  return (
    <div>
      <div
        className={`flex items-center gap-2 ${selected ? "bg-bg2" : ""}`}
        style={{ paddingInlineStart: depth * 16 }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "بستن زیر-تسک‌ها" : "باز کردن زیر-تسک‌ها"}
            className="flex size-5 shrink-0 items-center justify-center text-icon2 hover:text-icon"
          >
            <RemixIcon
              name={open ? "arrow-down-s-line" : "arrow-left-s-line"}
              className="text-base"
            />
          </button>
        ) : (
          <span className="size-5 shrink-0" />
        )}

        {/* کلیک روی خود ردیف پنل جزئیات تسک را باز می‌کند (نه ناوبری به صفحه‌ی دیگر). */}
        <button
          type="button"
          onClick={() => panel?.openTaskDetail(task, parentTask)}
          className="flex min-w-0 flex-1 items-center gap-2 py-2.5 text-start"
        >
          <PriorityDot priority={task.priority} />
          <span className="min-w-0 flex-1 truncate text-sm text-foreground">{task.title}</span>
          <span className="shrink-0 text-xs text-text2">{STATUS_LABEL[task.status]}</span>
        </button>

        <TagsField tags={task.tags ?? []} onChange={(tags) => onUpdate(task.id, { tags })} />
        <DateField value={task.dueDate} onChange={(value) => onUpdate(task.id, { dueDate: value || undefined })} />
        <AssigneeField
          task={task}
          projectId={projectId}
          avatarOnly
          onChange={(names) => onUpdate(task.id, { assigneeNames: names.length > 0 ? names : undefined })}
        />
        {!parentTask && <button type="button" onClick={() => { setSubtaskError(false); setAddingSubtask(true); setOpen(true) }} aria-label={t("taskForm.addSubtask")} title={t("taskForm.addSubtask")} className={fieldIconTriggerClass}>
          <RemixIcon name="git-branch-line" className="text-base" />
        </button>}
      </div>

      {hasChildren && open && (
        <div className="border-t border-border">
          {task.subtasks!.map((subtask) => (
            <TreeRow key={subtask.id} task={subtask} parentTask={task} depth={depth + 1} projectId={projectId} onUpdate={onUpdate} />
          ))}
        </div>
      )}
      {!parentTask && addingSubtask && <form onSubmit={saveNewSubtask} className="flex min-h-9 flex-wrap items-center gap-2 border-t border-border pe-2" style={{ paddingInlineStart: 16 }}>
        <RemixIcon name="git-branch-line" className="shrink-0 text-base text-text3" />
        <input ref={subtaskInputRef} value={subtaskTitle} onChange={(event) => setSubtaskTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") { setAddingSubtask(false); setSubtaskTitle("") } }} placeholder={t("newTask.subtaskPlaceholder")} aria-label={t("newTask.subtaskPlaceholder")} className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" />
        <button type="submit" disabled={!subtaskTitle.trim() || savingSubtask} className="text-xs text-link disabled:opacity-50">{savingSubtask ? "…" : t("workspace.register")}</button>
        {subtaskError && <span role="alert" className="w-full pb-1 text-xs text-error">{t("taskForm.subtaskError")}</span>}
      </form>}
    </div>
  )
}

/**
 * نمای درختی تسک‌ها. کلیک روی هر ردیف، پنل جزئیات همان تسک را در نوار تب صفحه باز می‌کند
 * (رجوع به `src/components/providers/task-panel-provider.tsx`)؛ اگر این نما جایی بیرون از
 * `TaskPanelProvider` رندر شود، کلیک بی‌اثر می‌ماند و بقیه‌ی رفتارها سر جایشان می‌مانند.
 *
 * پیل‌های تگ/تاریخ/مسئول انتهای هر ردیف همان کامپوننت‌های `board-view.tsx` را برای یکدست
 * بودن رفتار (و جلوگیری از باز شدن پنل هنگام کلیک روی خودشان) به‌اشتراک می‌گذارند. مثل بقیه‌ی
 * این فاز، تغییرها فقط در state محلی همین کامپوننت اعمال می‌شوند (بدون پایداری واقعی) — با
 * یک آپدیت بازگشتی یک‌سطحی چون زیر-تسک‌ها حداکثر یک سطح دارند.
 */
export function TreeView({ tasks: initialTasks, projectId }: { tasks: Task[]; projectId?: string }) {
  const t = useT()
  const panel = useTaskPanel()
  const [tasks, setTasks] = useState(initialTasks)
  const [addingAfter, setAddingAfter] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [saving, setSaving] = useState(false)
  const [createError, setCreateError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (addingAfter !== null) inputRef.current?.focus()
  }, [addingAfter])

  useEffect(() => {
    const syncSavedTask = (event: Event) => {
      const saved = (event as CustomEvent<Task>).detail
      setTasks((previous) => previous.map((task) => task.id === saved.id ? saved : task))
    }
    window.addEventListener("task-details-changed", syncSavedTask)
    return () => window.removeEventListener("task-details-changed", syncSavedTask)
  }, [])

  function updateTask(taskId: string, patch: Partial<Task>) {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) return { ...task, ...patch }
        if (task.subtasks?.some((sub) => sub.id === taskId)) {
          return {
            ...task,
            subtasks: task.subtasks.map((sub) => (sub.id === taskId ? { ...sub, ...patch } : sub)),
          }
        }
        return task
      })
    )
  }

  function startAdding(afterId: string | null) {
    if (!projectId) {
      panel?.openNewTask()
      return
    }
    setNewTitle("")
    setAddingAfter(afterId)
  }

  async function saveNewTask(event: FormEvent) {
    event.preventDefault()
    const title = newTitle.trim()
    if (!title || !projectId || !panel || saving) return
    setSaving(true)
    setCreateError(false)
    try {
      const created = await createTask({ title, projectId, priority: "none", tags: [], status: "todo" }, { id: panel.user.id, name: panel.user.name })
      setTasks((previous) => {
        const anchorIndex = addingAfter ? previous.findIndex((task) => task.id === addingAfter) : -1
        const next = [...previous]
        next.splice(anchorIndex < 0 ? next.length : anchorIndex + 1, 0, created)
        return next
      })
      setAddingAfter(null)
      setNewTitle("")
    } catch {
      setCreateError(true)
    } finally {
      setSaving(false)
    }
  }

  const quickAddRow = (afterId: string | null) => addingAfter === afterId ? (
    <form key={`draft-${afterId ?? "end"}`} onSubmit={saveNewTask} className="flex min-h-9 flex-wrap items-center gap-2 border-t border-border px-2">
      <RemixIcon name="add-line" className="shrink-0 text-base text-text3" />
      <input ref={inputRef} autoFocus value={newTitle} onChange={(event) => setNewTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setAddingAfter(null) }} placeholder={t("taskForm.titlePlaceholder")} aria-label={t("taskForm.titlePlaceholder")} className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" />
      <button type="submit" disabled={!newTitle.trim() || saving} className="text-xs text-link disabled:opacity-50">{saving ? "…" : t("taskForm.submit")}</button>
      {createError && <span role="alert" className="w-full pb-1 text-xs text-error">{t("newTask.submitError")}</span>}
    </form>
  ) : (
    <button key={`add-${afterId ?? "end"}`} type="button" onClick={() => startAdding(afterId)} className="flex min-h-9 w-full items-center gap-2 border-t border-border px-2 text-start text-sm text-text3 hover:bg-bg2 hover:text-foreground">
      <RemixIcon name="add-line" className="text-base" />{t("taskForm.quickAdd")}
    </button>
  )

  if (tasks.length === 0) {
    return <div className="flex flex-col"><p className="py-8 text-center text-sm text-text2">تسکی وجود ندارد.</p>{quickAddRow(null)}</div>
  }

  return (
    <div className="flex flex-col">
      {tasks.map((task, index) => (
        <div key={task.id}>
          <div className={index > 0 ? "border-t border-border" : ""}><TreeRow task={task} depth={0} projectId={projectId} onUpdate={updateTask} /></div>
        </div>
      ))}
      {quickAddRow(tasks[tasks.length - 1].id)}
    </div>
  )
}
