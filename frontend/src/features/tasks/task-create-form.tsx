"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { DatePickerDialog } from "@/components/ui/date-picker-dialog"
import { DialogTrigger } from "@/components/ui/dialog"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useT } from "@/components/providers/locale-provider"
import { PriorityDot } from "@/features/projects/task-display"
import { createTask } from "@/lib/api/tasks"
import type { TranslationKey } from "@/lib/i18n/dictionary"
import type { TaskFormProjectOption, TaskPriority } from "@/lib/api/types"

const PRIORITIES: TaskPriority[] = ["none", "low", "medium", "high", "urgent"]

const PRIORITY_KEY: Record<TaskPriority, TranslationKey> = {
  none: "priority.none",
  low: "priority.low",
  medium: "priority.medium",
  high: "priority.high",
  urgent: "priority.urgent",
}

const PILL_CLASS =
  "flex items-center gap-1.5 rounded-md p-2 text-sm text-text2 hover:bg-bg2 hover:text-foreground"

const INLINE_FIELD_CLASS =
  "min-w-0 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-text3"

/**
 * فرم ساخت تسک جدید — الگوی بصری برگرفته از طرح Figma «Create Task modal» (پیل‌های Ghost
 * قابل‌کلیک برای پروژه/تگ/تاریخ/مسئول به‌جای سلکت‌های ساده، عنوان بزرگ با انتخابگر اولویت
 * کنارش)، اما با آیکون‌های خودمان (RemixIcon) به‌جای آیکون‌های طرح. بخش‌های طرح که به مدل
 * داده‌ی فعلی ما تعلق ندارند (شناسه‌ی تسک، علاقه‌مندی، ساخته‌شده‌توسط/کامنت — چون تسک هنوز
 * ذخیره نشده) عمداً حذف شده‌اند؛ فقط ردیف «الصاق فایل» به‌صورت غیرفعال مثل بقیه‌ی اپ نگه
 * داشته شده (رجوع به src/features/tasks/README.md).
 */
export function TaskCreateForm({ projects }: { projects: TaskFormProjectOption[] }) {
  const router = useRouter()
  const t = useT()

  const [title, setTitle] = useState("")
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "")
  const [assigneeName, setAssigneeName] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("none")
  const [tagsText, setTagsText] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [editingTag, setEditingTag] = useState(false)

  const selectedProject = projects.find((project) => project.id === projectId)
  const canSubmit = title.trim().length > 0 && projectId.length > 0 && !submitting

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    await createTask({
      title: title.trim(),
      projectId,
      assigneeName: assigneeName || undefined,
      dueDate: dueDate.trim() || undefined,
      priority,
      tags: tagsText
        .split("،")
        .map((tag) => tag.trim())
        .filter(Boolean),
      description: description.trim() || undefined,
    })
    router.back()
  }

  if (projects.length === 0) {
    return <p className="py-8 text-center text-sm text-text2">{t("taskForm.noProjects")}</p>
  }

  return (
    <form onSubmit={submit} className="flex flex-col">
      <div className="flex items-center gap-2 py-2">
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
            <DropdownMenuRadioGroup value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
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
            <DropdownMenuRadioGroup value={assigneeName} onValueChange={(value) => setAssigneeName(value as string)}>
              <DropdownMenuRadioItem value="" closeOnClick>
                {t("taskForm.noAssignee")}
              </DropdownMenuRadioItem>
              {selectedProject?.memberNames.map((name) => (
                <DropdownMenuRadioItem key={name} value={name} closeOnClick>
                  {name}
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

      <div className="sticky bottom-0 -mx-4 mt-4 flex items-center justify-between border-t border-border bg-background px-4 py-3">
        <Button type="submit" disabled={!canSubmit}>
          <RemixIcon name="check-line" className="text-base" />
          {t("taskForm.submit")}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          {t("taskForm.cancel")}
        </Button>
      </div>
    </form>
  )
}
