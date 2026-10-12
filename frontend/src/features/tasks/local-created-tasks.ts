import type { NewTaskInput } from "@/lib/api/types"

export const LOCAL_CREATED_TASKS_KEY = "quire:created-tasks:v1"
export type LocalCreatedTask = NewTaskInput & { id: string; createdAt: string; updatedAt: string }

function readTasks(): LocalCreatedTask[] {
  const stored = localStorage.getItem(LOCAL_CREATED_TASKS_KEY)
  if (!stored) return []
  const parsed: unknown = JSON.parse(stored)
  if (!Array.isArray(parsed)) throw new Error("Invalid local task storage")
  return parsed as LocalCreatedTask[]
}

/** ذخیره همان رکورد؛ خطای storage به مصرف‌کننده برمی‌گردد. */
export async function saveLocalCreatedTask(id: string, input: NewTaskInput): Promise<void> {
  const tasks = readTasks()
  const previous = tasks.find(task => task.id === id)
  const now = new Date().toISOString()
  const task: LocalCreatedTask = { ...input, id, createdAt: previous?.createdAt ?? now, updatedAt: now }
  localStorage.setItem(LOCAL_CREATED_TASKS_KEY, JSON.stringify([...tasks.filter(task => task.id !== id), task]))
}

export async function deleteLocalCreatedTask(id: string): Promise<void> {
  localStorage.setItem(LOCAL_CREATED_TASKS_KEY, JSON.stringify(readTasks().filter(task => task.id !== id)))
}
