"use client"

import { updateTask } from "@/lib/api/tasks"
import type { Task, TaskFormProjectOption } from "@/lib/api/types"
import { TaskForm } from "./task-form"

/**
 * حالت «ویرایش» فرم مشترک `TaskForm` — همان فرم ساخت تسک است با مقدارهای اولیه‌ی تسک و
 * یک پیل «وضعیت» اضافه. با کلیک روی یک تسک در `TreeView` باز می‌شود.
 *
 * هیچ دکمه‌ی «انصراف/ذخیره»‌ای در این حالت نیست: `TaskForm` هر تغییری را خودش با یک تاخیر
 * کوتاه (debounce) از طریق همین `onSubmit` ذخیره می‌کند (رجوع به `useEffect` داخل
 * `TaskForm`) — پس اینجا برخلاف قبل دیگر `onDone()` را صدا نمی‌زنیم، وگرنه پنل بعد از هر
 * تغییر بسته می‌شد. بستن پنل فقط با دکمه‌ی × بالای `TaskPanel` انجام می‌شود. `updateTask`
 * هنوز فقط لاگ می‌کند (بدون پایداری واقعی).
 */
export function TaskDetailForm({
  task,
  projects,
  projectId,
  onDone,
}: {
  task: Task
  projects: TaskFormProjectOption[]
  /** پروژه‌ی تسک، اگر مشخص باشد (تسک‌های تب «تسک‌های من» آن را دارند). */
  projectId?: string
  onDone: () => void
}) {
  return (
    <TaskForm
      projects={projects}
      task={task}
      defaultProjectId={projectId}
      submitLabelKey="taskDetail.save"
      onCancel={onDone}
      onSubmit={async (values) => {
        await updateTask({
          id: task.id,
          title: values.title,
          assigneeName: values.assigneeName || undefined,
          dueDate: values.dueDate || undefined,
          startDate: values.startDate || undefined,
          repeat: values.repeat,
          priority: values.priority,
          status: values.status,
          tags: values.tags,
          description: values.description || undefined,
          followers: values.followers,
          isFavorite: values.isFavorite,
          timeSpentMinutes: values.timeSpentMinutes,
        })
      }}
    />
  )
}
