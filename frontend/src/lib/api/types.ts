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
  /** برچسب‌های تسک (Tag) — فعلاً فقط در فرم ساخت تسک ست می‌شود و هیچ نمایی آن را نشان نمی‌دهد */
  tags?: string[]
  /** توضیحات تسک — فعلاً فقط در فرم ساخت تسک ست می‌شود (صفحه‌ی جزئیات تسک هنوز وجود ندارد) */
  description?: string
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

/** تنظیمات اعلان کاربر — مطابق سوییچ‌های صفحه‌ی «حساب کاربری». */
export type NotificationPreferences = {
  /** وقتی تسکی به من تخصیص داده می‌شود */
  taskAssigned: boolean
  /** کامنت جدید روی تسک‌های من */
  taskComments: boolean
  /** خلاصه‌ی هفتگی فعالیت */
  weeklyDigest: boolean
}

/** فایلی که کاربر به پروفایل خودش پیوست کرده — در Overview تب «تسک‌های من» نمایش داده می‌شود. */
export type UserAttachment = {
  id: string
  name: string
  /** اندازه‌ی آماده برای نمایش (مثل «۱.۲ مگابایت») — محاسبه‌ی واقعی حجم هنوز پیاده نشده */
  sizeLabel: string
}

/**
 * کاربر واردشده (Current User). فیلدهای پروفایل (نام، ایمیل، عکس، توضیحات) علاوه بر تب
 * «حساب کاربری»، در Overview تب «تسک‌های من» هم استفاده خواهند شد.
 */
export type CurrentUser = {
  id: string
  name: string
  email: string
  /** آدرس عکس پروفایل؛ اگر نبود، حرف اول نام در AvatarFallback نمایش داده می‌شود */
  avatarUrl?: string
  /** توضیح کوتاه کاربر (Bio) */
  bio?: string
  notifications: NotificationPreferences
  /** فایل‌های پیوست‌شده‌ی کاربر (بخش پروفایل در Overview تب «تسک‌های من») */
  attachments: UserAttachment[]
}

/** تسک تخصیص‌داده‌شده به کاربر، به‌همراه پروژه‌ای که از آن آمده (چون لیست بین‌پروژه‌ای است). */
export type MyTask = Task & {
  projectId: string
  projectName: string
}

/**
 * داده‌ی تجمیعی Overview تب «تسک‌های من» — همان مفاهیم سطح پروژه، اما روی همه‌ی
 * پروژه‌های کاربر (رجوع به docs/PRODUCT_OVERVIEW.md بخش «تب ۲ — تسک‌های من»).
 */
export type MyTasksOverview = {
  /** تسک‌هایی که نیاز به رسیدگی فوری دارند (عقب‌افتاده یا اولویت فوری) */
  attentionRequired: MyTask[]
  statusDistribution: StatusDistribution
  /** Project Health تجمیع‌شده روی همه‌ی پروژه‌های کاربر */
  health: ProjectHealth
  /** سطح فعالیت روزانه‌ی خود کاربر برای ActivityHeatmap (Portfolio Activity) */
  activity: number[]
}

/** ورودی ساخت تسک جدید (فرم `features/tasks/TaskCreateForm`). */
export type NewTaskInput = {
  title: string
  projectId: string
  assigneeName?: string
  dueDate?: string
  priority: TaskPriority
  tags: string[]
  description?: string
}

/** یک گزینه‌ی پروژه در فرم ساخت تسک، به‌همراه اعضایی که می‌توانند مسئول تسک شوند. */
export type TaskFormProjectOption = {
  id: string
  name: string
  organizationName: string
  memberNames: string[]
}
