"use client"

import { updateTask } from "@/lib/api/tasks"
import type { Task, TaskFormProjectOption } from "@/lib/api/types"
import { TaskForm } from "./task-form"

/**
 * حالت «ویرایش» فرم مشترک `TaskForm` — همان فرم ساخت تسک است با مقدارهای اولیه‌ی تسک و
 * یک پیل «وضعیت» اضافه. با کلیک روی یک تسک در `TreeView` باز می‌شود.
 *
 * تغییرها جایی ذخیره نمی‌شوند (`updateTask` هنوز فقط لاگ می‌کند) و با بستن پنل از بین می‌روند.
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
          priority: values.priority,
          status: values.status,
          tags: values.tags,
          description: values.description || undefined,
        })
        onDone()
      }}
    />
  )
}
