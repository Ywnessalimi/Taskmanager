import { BackendApiError, backendRequest } from "./backend-client"
import { getCurrentUser } from "./users"
import type { NewTaskInput, ProjectRef, Task, TaskFormProjectOption, TaskUpdateInput } from "./types"

/**
 * گزینه‌های فرم ساخت تسک از داده‌های مرجع فعلی ساخته می‌شوند: هر پروژه به‌همراه اعضای سازمانی
 * که طبق docs/PRODUCT_OVERVIEW.md می‌توانند مسئول تسک شوند.
 */
export async function getTaskFormOptions(): Promise<TaskFormProjectOption[]> {
  const [projects, user] = await Promise.all([
    backendRequest<Array<ProjectRef & { organizationName: string }>>("/projects"),
    getCurrentUser(),
  ])
  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    slug: project.slug,
    organizationSlug: project.organizationSlug,
    organizationName: project.organizationName,
    members: [{ id: user.id, name: user.name, avatarUrl: user.avatarUrl }],
  }))
}

/**
 * ساخت Task پایدار از طریق API نسخهٔ ۱.
 */
export async function createTask(input: NewTaskInput, actor?: { id: string; name: string }): Promise<Task> {
  return backendRequest<Task>("/tasks", { method: "POST", body: JSON.stringify({ ...input, ...(actor ? { actorId: actor.id, actorName: actor.name } : {}) }) })
}

/**
 * ویرایش Task پایدار از طریق API نسخهٔ ۱.
 */
export async function updateTask(input: TaskUpdateInput, actor?: { id: string; name: string }): Promise<Task> {
  const { id, ...patch } = input
  return backendRequest<Task>(`/tasks/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ ...patch, ...(actor ? { actorId: actor.id, actorName: actor.name } : {}) }) })
}

export async function getTask(id: string): Promise<Task | undefined> {
  try {
    return await backendRequest<Task>(`/tasks/${encodeURIComponent(id)}`)
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 404) return undefined
    throw error
  }
}

/** حذف Task پایدار از API نسخهٔ ۱. */
export async function deleteTask(id: string): Promise<void> {
  return backendRequest<void>(`/tasks/${encodeURIComponent(id)}`, { method: "DELETE" })
}
