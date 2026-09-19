"use client"

import { useRouter } from "next/navigation"
import { createTask } from "@/lib/api/tasks"
import type { TaskFormProjectOption } from "@/lib/api/types"
import { TaskForm } from "./task-form"

/**
 * حالت «ساخت» فرم مشترک `TaskForm` — کل رابط کاربری آنجاست و اینجا فقط ذخیره‌سازی و
 * رفتار بعد از پایان تعریف می‌شود.
 *
 * دو مصرف‌کننده دارد: صفحه‌ی کامل `/tasks/new` (موبایل، بدون `onDone` — بعد از ثبت/انصراف
 * `router.back()` می‌شود) و `TaskPanel` (پنل کناری داخل `SectionTabs`، با `onDone` که پنل را می‌بندد).
 */
export function TaskCreateForm({
  projects,
  onDone,
}: {
  projects: TaskFormProjectOption[]
  onDone?: () => void
}) {
  const router = useRouter()

  function finish() {
    if (onDone) onDone()
    else router.back()
  }

  return (
    <TaskForm
      projects={projects}
      submitLabelKey="taskForm.submit"
      onCancel={finish}
      onSubmit={async (values) => {
        await createTask({
          title: values.title,
          projectId: values.projectId,
          assigneeName: values.assigneeName || undefined,
          dueDate: values.dueDate || undefined,
          startDate: values.startDate || undefined,
          repeat: values.repeat,
          priority: values.priority,
          tags: values.tags,
          description: values.description || undefined,
        })
        finish()
      }}
    />
  )
}
