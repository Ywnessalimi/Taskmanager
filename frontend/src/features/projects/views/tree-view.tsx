"use client"

import { useState } from "react"
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
  depth,
  projectId,
  onUpdate,
}: {
  task: Task
  depth: number
  projectId?: string
  onUpdate: (taskId: string, patch: Partial<Task>) => void
}) {
  const [open, setOpen] = useState(false)
  const panel = useTaskPanel()
  const hasChildren = Boolean(task.subtasks && task.subtasks.length > 0)

  /** ردیف فعلاً انتخاب‌شده در پنل — تا کاربر بداند پنل کنار دستش مال کدام تسک است. */
  const selected = panel?.panel?.kind === "detail" && panel.panel.task.id === task.id

  return (
    <div>
      <div
        className={`flex items-center gap-2 ${selected ? "bg-bg2" : ""}`}
        style={{ paddingInlineStart: depth * 20 }}
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
          onClick={() => panel?.openTaskDetail(task)}
          className="flex min-w-0 flex-1 items-center gap-2 py-2 text-start"
        >
          <PriorityDot priority={task.priority} />
          <span className="w-12 shrink-0 text-xs text-text3">{task.displayId}</span>
          <span className="min-w-0 flex-1 truncate text-sm text-foreground">{task.title}</span>
          <span className="shrink-0 text-xs text-text2">{STATUS_LABEL[task.status]}</span>
        </button>

        <TagsField tags={task.tags ?? []} onChange={(tags) => onUpdate(task.id, { tags })} />
        <DateField value={task.dueDate} onChange={(value) => onUpdate(task.id, { dueDate: value || undefined })} />
        <AssigneeField
          task={task}
          projectId={projectId}
          onChange={(names) => onUpdate(task.id, { assigneeNames: names.length > 0 ? names : undefined })}
        />
      </div>

      {hasChildren && open && (
        <div className="border-t border-border">
          {task.subtasks!.map((subtask) => (
            <TreeRow key={subtask.id} task={subtask} depth={depth + 1} projectId={projectId} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * نمای درختی تسک‌ها. کلیک روی هر ردیف، پنل جزئیات همان تسک را در `SectionTabs` باز می‌کند
 * (رجوع به `src/components/providers/task-panel-provider.tsx`)؛ اگر این نما جایی بیرون از
 * `TaskPanelProvider` رندر شود، کلیک بی‌اثر می‌ماند و بقیه‌ی رفتارها سر جایشان می‌مانند.
 *
 * پیل‌های تگ/تاریخ/مسئول انتهای هر ردیف همان کامپوننت‌های `board-view.tsx` را برای یکدست
 * بودن رفتار (و جلوگیری از باز شدن پنل هنگام کلیک روی خودشان) به‌اشتراک می‌گذارند. مثل بقیه‌ی
 * این فاز، تغییرها فقط در state محلی همین کامپوننت اعمال می‌شوند (بدون پایداری واقعی) — با
 * یک آپدیت بازگشتی یک‌سطحی چون زیر-تسک‌ها حداکثر یک سطح دارند.
 */
export function TreeView({ tasks: initialTasks, projectId }: { tasks: Task[]; projectId?: string }) {
  const [tasks, setTasks] = useState(initialTasks)

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

  if (tasks.length === 0) {
    return <p className="py-8 text-center text-sm text-text2">تسکی وجود ندارد.</p>
  }

  return (
    <div className="flex flex-col">
      {tasks.map((task, index) => (
        <div key={task.id} className={index > 0 ? "border-t border-border" : ""}>
          <TreeRow task={task} depth={0} projectId={projectId} onUpdate={updateTask} />
        </div>
      ))}
    </div>
  )
}
