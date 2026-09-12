"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RemixIcon } from "@/components/ui/remix-icon"
import { PRIORITY_LABEL } from "@/features/projects/task-display"
import { createTask } from "@/lib/api/tasks"
import type { TaskFormProjectOption, TaskPriority } from "@/lib/api/types"

const FIELD_CLASS =
  "w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-text3"

const PRIORITIES: TaskPriority[] = ["none", "low", "medium", "high", "urgent"]

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-text2">{label}</span>
      {children}
      {hint && <span className="text-xs text-text3">{hint}</span>}
    </label>
  )
}

/**
 * فرم ساخت تسک جدید. فیلدها همان فیلدهای اولیه‌ی مدل تسک‌اند؛ پیوست/کامنت/تایمر/زیر-تسک
 * عمداً اینجا نیستند چون طبق docs/PRODUCT_OVERVIEW.md به صفحه‌ی جزئیات تسک تعلق دارند.
 */
export function TaskCreateForm({ projects }: { projects: TaskFormProjectOption[] }) {
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "")
  const [assigneeName, setAssigneeName] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("none")
  const [tagsText, setTagsText] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

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
    return <p className="py-8 text-center text-sm text-text2">هنوز پروژه‌ای برای ساخت تسک وجود ندارد.</p>
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="عنوان تسک">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="مثلاً: طراحی صفحه‌ی ورود"
          autoFocus
          className={FIELD_CLASS}
        />
      </Field>

      <Field label="پروژه" hint={selectedProject?.organizationName}>
        <select
          value={projectId}
          onChange={(e) => {
            setProjectId(e.target.value)
            setAssigneeName("")
          }}
          className={FIELD_CLASS}
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="مسئول">
        <select
          value={assigneeName}
          onChange={(e) => setAssigneeName(e.target.value)}
          className={FIELD_CLASS}
        >
          <option value="">بدون مسئول</option>
          {selectedProject?.memberNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="تاریخ سررسید" hint="قالب: ۱۴۰۴/۰۶/۰۱ (با رقم لاتین)">
        <input
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          placeholder="1404/06/01"
          inputMode="numeric"
          className={FIELD_CLASS}
        />
      </Field>

      <Field label="اولویت">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          className={FIELD_CLASS}
        >
          {PRIORITIES.map((value) => (
            <option key={value} value={value}>
              {PRIORITY_LABEL[value]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="برچسب" hint="چند برچسب را با «،» از هم جدا کنید">
        <input
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="طراحی، فوری"
          className={FIELD_CLASS}
        />
      </Field>

      <Field label="توضیحات">
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="توضیح کوتاهی درباره‌ی این تسک"
          className={`${FIELD_CLASS} resize-none`}
        />
      </Field>

      <div className="flex gap-2">
        <Button type="submit" disabled={!canSubmit}>
          <RemixIcon name="check-line" className="text-base" />
          ساخت تسک
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          انصراف
        </Button>
      </div>
    </form>
  )
}
