/**
 * تایپ‌های موجودیت‌های محصول — باید با مدل داده‌ی بک‌اند هماهنگ بمانند.
 * رجوع کنید به docs/BACKEND.md بخش «مدل داده» و docs/PRODUCT_OVERVIEW.md بخش «واژه‌نامه».
 */

export type Member = {
  id: string
  name: string
}

export type ProjectRef = {
  id: string
  name: string
}

export type ProjectHealth = {
  active: number
  completed: number
  dueInPeriod: number
  overdue: number
}

export type StatusDistribution = {
  todo: number
  inProgress: number
  completed: number
}

export type TaskPriority = "none" | "low" | "medium" | "high" | "urgent"
export type TaskStatus = "todo" | "in-progress" | "completed"

export type Task = {
  id: string
  displayId: string
  title: string
  assigneeName?: string
  priority: TaskPriority
  dueDate?: string
  status: TaskStatus
}

export type Project = {
  id: string
  name: string
  organizationId: string
  organizationName: string
  startDate: string
  endDate: string
  health: ProjectHealth
  statusDistribution: StatusDistribution
  tasks: Task[]
  /** سطح فعالیت روزانه برای ActivityHeatmap (هر عدد بین ۰ تا ۴) */
  activity: number[]
}

export type Organization = {
  id: string
  name: string
  members: Member[]
  projects: ProjectRef[]
  taskCount: number
  activity: number[]
}
