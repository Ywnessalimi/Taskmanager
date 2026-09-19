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
  /** آدرس عکس پروفایل (فعلاً SVG های دست‌ساز در public/avatars، نه عکس واقعی کاربر) */
  avatarUrl?: string
}

export type ProjectRef = {
  id: string
  name: string
  /** درصد پیشرفت (سهم تسک‌های completed از کل تسک‌های پروژه)، برای ردیف پروژه در صفحه‌ی سازمان */
  progress: number
}

export type ProjectHealth = {
  active: number
  completed: number
  dueInPeriod: number
  overdue: number
}

/**
 * روند روزانه‌ی هر متریک سلامت برای نمودار خطی «سلامت پروژه» — مثل `Project.activity`
 * صرفاً شکل بصری Mock است (رجوع به `mockHealthTrend` در `mock-data.ts`)، نه تاریخچه‌ی
 * واقعی ذخیره‌شده؛ آخرین مقدار هر آرایه همیشه با همان متریک در `ProjectHealth` یکی است.
 */
export type ProjectHealthTrend = Record<keyof ProjectHealth, number[]>

export type StatusDistribution = {
  todo: number
  inProgress: number
  completed: number
}

export type TaskPriority = "none" | "low" | "medium" | "high" | "urgent"
export type TaskStatus = "todo" | "in-progress" | "completed"

/** الگوی تکرار تسک — روی «تاریخ» تسک تنظیم می‌شود (رجوع به `DateEditDialog`). */
export type RepeatOption = "none" | "daily" | "weekly" | "monthly"

/** یک ردیف از لاگ رویدادهای یک تسک — رجوع به یادداشت «TaskActivityEntry» در PRODUCT_OVERVIEW.md. */
export type TaskActivityEntry = {
  id: string
  actorName: string
  /** متن آماده‌ی رویداد (نه کلید ترجمه) — چون فعلاً کاملاً Mock است. */
  message: string
  date: string
}

export type Task = {
  id: string
  displayId: string
  title: string
  assigneeName?: string
  priority: TaskPriority
  dueDate?: string
  /** تاریخ شروع تسک — کنار `dueDate` در `DateEditDialog` تنظیم می‌شود. */
  startDate?: string
  /** الگوی تکرار تسک؛ نبودش یعنی «هیچ». */
  repeat?: RepeatOption
  status: TaskStatus
  /** برچسب‌های تسک (Tag) — فعلاً فقط در فرم ساخت تسک ست می‌شود و هیچ نمایی آن را نشان نمی‌دهد */
  tags?: string[]
  /** توضیحات تسک — فعلاً فقط در فرم ساخت تسک ست می‌شود (صفحه‌ی جزئیات تسک هنوز وجود ندارد) */
  description?: string
  /** زیر-تسک‌ها (Sublist) — فقط برای نمای Tree استفاده می‌شود، حداکثر یک سطح در مدل فعلی */
  subtasks?: Task[]
  /** نام اعضایی که این تسک را دنبال می‌کنند — مثل `assigneeName` با نام مچ می‌شود، نه id. */
  followers?: string[]
  /** آیا کاربر جاری این تسک را «مورد علاقه» علامت زده است. */
  isFavorite?: boolean
  /** مجموع دقیقه‌های صرف‌شده روی تسک (از تایمر). */
  timeSpentMinutes?: number
  /** فید متنی رویدادهای این تسک، جدیدترین اول — رجوع به `TaskActivityEntry`. */
  activityLog?: TaskActivityEntry[]
}

export type Project = {
  id: string
  name: string
  organizationId: string
  organizationName: string
  startDate: string
  endDate: string
  /** توضیحات پروژه — اختیاری، مثل `Task.description`؛ وقتی خالی است هدر نمای‌کلی جای‌گزین «افزودن توضیحات» را نشان می‌دهد. */
  description?: string
  health: ProjectHealth
  healthTrend: ProjectHealthTrend
  statusDistribution: StatusDistribution
  tasks: Task[]
  /** سطح فعالیت روزانه برای ActivityHeatmap (هر عدد بین ۰ تا ۴) */
  activity: number[]
  /** اعضای پروژه — از اعضای سازمان مالک پروژه مشتق می‌شود (رجوع به `getProject`)، نه فیلد مستقل Mock */
  members: Member[]
  /** ساعت آخرین به‌روزرسانی نمودار «فعالیت اعضا» به‌صورت ۲۴ساعته "HH:MM" — فعلاً Mock ثابت */
  activityUpdatedAt: string
}

export type Organization = {
  id: string
  name: string
  /** تاریخ ساخت سازمان (جلالی، رقم لاتین — مثل بقیه‌ی تاریخ‌های این مدل) */
  createdAt: string
  members: Member[]
  projects: ProjectRef[]
  taskCount: number
}

export type NotificationStatus = "unread" | "read"

export type NotificationTarget =
  | { type: "task"; id: string; label: string; projectId: string }
  | { type: "project"; id: string; label: string }
  | { type: "organization"; id: string; label: string }

/**
 * نوع رخداد اعلان — کلید ترجمه است، نه متن آماده، تا با تغییر زبان محتوای اعلان هم عوض شود
 * (رجوع به `src/lib/i18n/dictionary.ts` کلیدهای `notifications.verb.*`).
 */
export type NotificationVerb =
  | "taskAssigned"
  | "taskCommented"
  | "projectJoinRequested"
  | "orgAdminAssigned"
  | "taskStatusChanged"
  | "projectCreated"
  | "orgMemberAdded"

/** زمان نسبی به‌صورت ساختاریافته (نه رشته‌ی آماده) تا در هر زبان جداگانه فرمت شود. */
export type RelativeTime = { unit: "hours" | "days"; amount: number } | { unit: "yesterday" } | { unit: "week" }

export type Notification = {
  id: string
  verb: NotificationVerb
  /** فقط برای verb === "taskStatusChanged": وضعیت جدیدی که تسک به آن تغییر کرد. */
  verbStatus?: TaskStatus
  actorId?: string
  actorName?: string
  target: NotificationTarget
  status: NotificationStatus
  requiresApproval: boolean
  createdAt: RelativeTime
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
 * پروفایل عمومیِ قابل‌مشاهده‌ی هر کاربر (نه فقط کاربر واردشده) — برای صفحه‌ی `/users/[id]`.
 * چون مدل داده هنوز موجودیت جدای «User» ندارد (فقط `Member` داخل هر Organization)، این تایپ
 * با جست‌وجوی همان شناسه در میان اعضای همه‌ی سازمان‌ها ساخته می‌شود — رجوع به
 * `src/lib/api/users.ts` (`getUserById`) و `src/features/users/README.md`.
 */
export type PublicUser = {
  id: string
  name: string
  role: MemberRole
  activity: number[]
  /** فقط وقتی این کاربر همان کاربر واردشده باشد پر می‌شود (بقیه‌ی اعضا ایمیل/توضیح ندارند). */
  email?: string
  bio?: string
  avatarUrl?: string
  organizations: { id: string; name: string }[]
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

/** ورودی ویرایش یک تسک موجود (پنل جزئیات تسک). فقط فیلدهای قابل‌ویرایش فرم. */
export type TaskUpdateInput = {
  id: string
  title: string
  assigneeName?: string
  dueDate?: string
  startDate?: string
  repeat?: RepeatOption
  priority: TaskPriority
  status: TaskStatus
  tags: string[]
  description?: string
  followers: string[]
  isFavorite: boolean
  timeSpentMinutes: number
}

/** ورودی ساخت تسک جدید (فرم `features/tasks/TaskCreateForm`). */
export type NewTaskInput = {
  title: string
  projectId: string
  assigneeName?: string
  dueDate?: string
  startDate?: string
  repeat?: RepeatOption
  priority: TaskPriority
  tags: string[]
  description?: string
}

/** یک گزینه‌ی پروژه در فرم ساخت تسک، به‌همراه اعضایی که می‌توانند مسئول تسک شوند. */
/** یک عضو قابل‌انتخاب در سلکت «مسئول» فرم ساخت تسک — رجوع به `TaskFormProjectOption`. */
export type TaskFormMemberOption = {
  name: string
  avatarUrl?: string
}

export type TaskFormProjectOption = {
  id: string
  name: string
  organizationName: string
  members: TaskFormMemberOption[]
}
