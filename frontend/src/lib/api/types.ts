/**
 * تایپ‌های موجودیت‌های محصول — باید با مدل داده‌ی بک‌اند هماهنگ بمانند.
 * رجوع کنید به docs/BACKEND.md بخش «مدل داده» و docs/PRODUCT_OVERVIEW.md بخش «واژه‌نامه».
 */

export type MemberRole = "admin" | "member"

export type Member = {
  id: string
  name: string
  role: MemberRole
  /** سطح فعالیت روزانه (هر عدد بین ۰ تا ۴) برای ردیف فعالیت این عضو در صفحه‌ی سازمان */
  activity: number[]
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
  /** زیر-تسک‌ها (Sublist) — فقط برای نمای Tree استفاده می‌شود، حداکثر یک سطح در مدل فعلی */
  subtasks?: Task[]
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
}

export type NotificationStatus = "unread" | "read"

export type NotificationTarget =
  | { type: "task"; id: string; label: string; projectId: string }
  | { type: "project"; id: string; label: string }
  | { type: "organization"; id: string; label: string }

export type Notification = {
  id: string
  verb: string
  actorName?: string
  target: NotificationTarget
  status: NotificationStatus
  requiresApproval: boolean
  /** متن نسبی آماده برای نمایش (مثل «۲ ساعت پیش») — محاسبه‌ی زمان واقعی هنوز پیاده نشده */
  createdAtLabel: string
}
