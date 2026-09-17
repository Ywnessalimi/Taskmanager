"use client"

import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DatePickerDialog } from "@/components/ui/date-picker-dialog"
import { DialogTrigger } from "@/components/ui/dialog"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useT } from "@/components/providers/locale-provider"
import { PriorityDot } from "@/features/projects/task-display"
import type { TranslationKey } from "@/lib/i18n/dictionary"
import type { Task, TaskFormProjectOption, TaskPriority, TaskStatus } from "@/lib/api/types"

const PRIORITIES: TaskPriority[] = ["none", "low", "medium", "high", "urgent"]

const PRIORITY_KEY: Record<TaskPriority, TranslationKey> = {
  none: "priority.none",
  low: "priority.low",
  medium: "priority.medium",
  high: "priority.high",
  urgent: "priority.urgent",
}

const STATUSES: TaskStatus[] = ["todo", "in-progress", "completed"]

const STATUS_KEY: Record<TaskStatus, TranslationKey> = {
  todo: "status.todo",
  "in-progress": "status.inProgress",
  completed: "status.completed",
}

const PILL_CLASS =
  "flex items-center gap-1.5 rounded-md p-2 text-sm text-text2 hover:bg-bg2 hover:text-foreground"

const INLINE_FIELD_CLASS =
  "min-w-0 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-text3"

export type TaskFormValues = {
  title: string
  projectId: string
  assigneeName: string
  dueDate: string
  priority: TaskPriority
  status: TaskStatus
  tags: string[]
  description: string
}

/**
 * فرم مشترک تسک — هم برای ساخت تسک جدید (`TaskCreateForm`) و هم برای ویرایش یک تسک موجود
 * (`TaskDetailForm` در پنل جزئیات). الگوی بصری‌اش از طرح Figma «Create Task modal» می‌آید:
 * پیل‌های Ghost قابل‌کلیک برای پروژه/تگ/تاریخ/مسئول به‌جای سلکت‌های ساده، و عنوان بزرگ با
 * انتخابگر اولویت کنارش.
 *
 * تنها تفاوت دو حالت: در حالت ویرایش یک پیل «وضعیت» هم اضافه می‌شود (تسک تازه همیشه «در
 * انتظار» ساخته می‌شود، پس آنجا معنایی ندارد) و برچسب دکمه‌ی ثبت فرق می‌کند.
 *
 * چیدمانش یک ستون flex است که با `flex-1 min-h-0` فضای والدِ خودش را پر می‌کند: فیلدها داخل
 * ناحیه‌ی اسکرول‌شونده‌ی مستقل و نوار دکمه‌ها بیرون آن، تا همیشه چسبیده به پایین بماند.
 */
export function TaskForm({
  projects,
  task,
  defaultProjectId,
  submitLabelKey,
  onSubmit,
  onCancel,
}: {
  projects: TaskFormProjectOption[]
  /** تسک موجود؛ اگر داده شود فرم در حالت ویرایش است. */
  task?: Task
  defaultProjectId?: string
  submitLabelKey: TranslationKey
  onSubmit: (values: TaskFormValues) => Promise<void> | void
  onCancel: () => void
}) {
  const t = useT()
  const isEdit = Boolean(task)

  const [title, setTitle] = useState(task?.title ?? "")
  const [projectId, setProjectId] = useState(defaultProjectId ?? projects[0]?.id ?? "")
  const [assigneeName, setAssigneeName] = useState(task?.assigneeName ?? "")
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "")
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "none")
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "todo")
  const [tagsText, setTagsText] = useState(task?.tags?.join("، ") ?? "")
  const [description, setDescription] = useState(task?.description ?? "")
  const [submitting, setSubmitting] = useState(false)
  const [editingTag, setEditingTag] = useState(false)

  const selectedProject = projects.find((project) => project.id === projectId)
  const canSubmit = title.trim().length > 0 && projectId.length > 0 && !submitting

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    await onSubmit({
      title: title.trim(),
      projectId,
      assigneeName,
      dueDate: dueDate.trim(),
      priority,
      status,
      tags: tagsText
        .split("،")
        .map((tag) => tag.trim())
        .filter(Boolean),
      description: description.trim(),
    })
  }

  if (projects.length === 0) {
    return <p className="py-8 text-center text-sm text-text2">{t("taskForm.noProjects")}</p>
  }

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="flex items-center gap-2 py-2">
          {isEdit && <span className="shrink-0 text-xs text-text3">{task!.displayId}</span>}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("taskForm.titlePlaceholder")}
            autoFocus
            className="min-w-0 flex-1 bg-transparent text-lg font-medium text-foreground outline-none placeholder:text-text3"
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={t("taskForm.priorityAria")}
              className="flex shrink-0 items-center gap-1 rounded-md p-1.5 text-text2 hover:bg-bg2 hover:text-foreground"
            >
              <RemixIcon name="arrow-down-s-line" className="text-lg" />
              <PriorityDot priority={priority} label={t(PRIORITY_KEY[priority])} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={priority}
                onValueChange={(value) => setPriority(value as TaskPriority)}
              >
                {PRIORITIES.map((value) => (
                  <DropdownMenuRadioItem key={value} value={value} closeOnClick>
                    <PriorityDot priority={value} label={t(PRIORITY_KEY[value])} />
                    {t(PRIORITY_KEY[value])}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center gap-1 py-2">
          <DropdownMenu>
            <DropdownMenuTrigger className={PILL_CLASS}>
              <RemixIcon name="folder-3-line" className="text-base" />
              {selectedProject?.name ?? t("taskForm.project")}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup
                value={projectId}
                onValueChange={(value) => {
                  setProjectId(value as string)
                  setAssigneeName("")
                }}
              >
                {projects.map((project) => (
                  <DropdownMenuRadioItem key={project.id} value={project.id} closeOnClick>
                    {project.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {isEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger className={PILL_CLASS}>
                <RemixIcon name="progress-4-line" className="text-base" />
                {t(STATUS_KEY[status])}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuRadioGroup
                  value={status}
                  onValueChange={(value) => setStatus(value as TaskStatus)}
                >
                  {STATUSES.map((value) => (
                    <DropdownMenuRadioItem key={value} value={value} closeOnClick>
                      {t(STATUS_KEY[value])}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {editingTag ? (
            <input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              onBlur={() => setEditingTag(false)}
              placeholder={t("taskForm.tagPlaceholder")}
              autoFocus
              className={`${INLINE_FIELD_CLASS} flex-1`}
            />
          ) : (
            <button type="button" onClick={() => setEditingTag(true)} className={PILL_CLASS}>
              <RemixIcon name="price-tag-3-line" className="text-base" />
              {tagsText.trim() || t("taskForm.addTag")}
            </button>
          )}

          <DatePickerDialog
            value={dueDate}
            onChange={setDueDate}
            trigger={
              <DialogTrigger className={PILL_CLASS}>
                <RemixIcon name="calendar-line" className="text-base" />
                {dueDate || t("taskForm.addDate")}
              </DialogTrigger>
            }
          />

          <DropdownMenu>
            <DropdownMenuTrigger className={PILL_CLASS}>
              <RemixIcon name="user-line" className="text-base" />
              {assigneeName || t("taskForm.assign")}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup
                value={assigneeName}
                onValueChange={(value) => setAssigneeName(value as string)}
              >
                <DropdownMenuRadioItem value="" closeOnClick>
                  {t("taskForm.noAssignee")}
                </DropdownMenuRadioItem>
                {selectedProject?.members.map((member) => (
                  <DropdownMenuRadioItem key={member.name} value={member.name} closeOnClick>
                    <Avatar size="sm">
                      {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                      <AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    {member.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("taskForm.descriptionPlaceholder")}
          className="w-full resize-none border-t border-border bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-text2"
        />

        <div className="flex cursor-not-allowed items-center gap-1.5 border-y border-border py-3 text-sm text-text3">
          <RemixIcon name="attachment-line" className="text-base" />
          {t("taskForm.attachFile")}
        </div>

        {isEdit && task!.subtasks && task!.subtasks.length > 0 && (
          <div className="flex flex-col pt-3">
            <span className="pb-1 text-xs text-text2">{t("taskDetail.subtasks")}</span>
            {task!.subtasks!.map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-center gap-2 border-b border-border py-2 last:border-b-0"
              >
                <PriorityDot priority={subtask.priority} />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {subtask.title}
                </span>
                <span className="shrink-0 text-xs text-text2">{t(STATUS_KEY[subtask.status])}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-border bg-background px-4 py-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("taskForm.cancel")}
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          <RemixIcon name="check-line" className="text-base" />
          {t(submitLabelKey)}
        </Button>
      </div>
    </form>
  )
}
