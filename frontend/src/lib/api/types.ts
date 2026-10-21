/**
 * تایپ‌های موجودیت‌های محصول — باید با مدل داده‌ی بک‌اند هماهنگ بمانند.
 * رجوع کنید به docs/BACKEND.md بخش «مدل داده» و docs/PRODUCT_OVERVIEW.md بخش «واژه‌نامه».
 */

export type MemberRole = "owner" | "admin" | "member" | "custom"

export type Member = {
  id: string
  name: string
  role: MemberRole
  /** سطح فعالیت روزانه (هر عدد بین ۰ تا ۴) برای ردیف فعالیت این عضو در صفحه‌ی سازمان */
  activity: number[]
  /** آدرس عکس پروفایل عضو؛ در fixtureها پرتره‌ی ساختگی است. */
  avatarUrl?: string
}

export type OrganizationMember = Omit<Member, "role"> & {
  role: MemberRole
  email?: string
  permissions?: Record<string, boolean>
}

export type ProjectRef = {
  id: string
  name: string
  slug?: string
  organizationSlug?: string
  /** شناسه‌های اعضایی که در داده‌ی فعلی دسترسی به این پروژه دارند. */
  memberIds: string[]
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

/** الگوی تکرار تسک؛ dates برای سازگاری با رکوردهای قدیمی باقی مانده است. */
export type TaskRecurrence = { dates: string[]; count: number; frequency?: RepeatOption; interval?: number; weekdays?: number[] }

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
  /** شناسهٔ پروژه در API؛ برای تسک‌های Mock قدیمی ممکن است خالی باشد. */
  projectId?: string
  title: string
  /** نام‌های مسئولان تسک — یک تسک می‌تواند چند مسئول همزمان داشته باشد. */
  assigneeNames?: string[]
  priority: TaskPriority
  dueDate?: string
  /** تاریخ شروع تسک — کنار `dueDate` در `DateEditDialog` تنظیم می‌شود. */
  startDate?: string
  /** الگوی تکرار تسک؛ نبودش یعنی «هیچ». */
  recurrence?: TaskRecurrence
  repeat?: RepeatOption
  status: TaskStatus
  /** برچسب‌های تسک (Tag) — فعلاً فقط در فرم ساخت تسک ست می‌شود و هیچ نمایی آن را نشان نمی‌دهد */
  tags?: string[]
  /** توضیحات تسک — فعلاً فقط در فرم ساخت تسک ست می‌شود (صفحه‌ی جزئیات تسک هنوز وجود ندارد) */
  description?: string
  /** زیر-تسک‌ها (Sublist) — فقط برای نمای Tree استفاده می‌شود، حداکثر یک سطح در مدل فعلی */
  subtasks?: Task[]
  /** نام اعضایی که این تسک را دنبال می‌کنند — مثل `assigneeNames` با نام مچ می‌شود، نه id. */
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
  slug?: string
  organizationId: string
  organizationName: string
  organizationSlug?: string
  divisionId: string
  divisionName: string
  /** شناسه‌های اعضای مجاز پروژه؛ منبع فیلتر دسترسی در لایه‌ی داده‌ی فعلی. */
  memberIds: string[]
  startDate: string
  endDate: string
  /** توضیحات پروژه — اختیاری، مثل `Task.description`؛ وقتی خالی است هدر نمای‌کلی جای‌گزین «افزودن توضیحات» را نشان می‌دهد. */
  description?: string
  health: ProjectHealth
  healthTrend?: ProjectHealthTrend
  statusDistribution: StatusDistribution
  tasks: Task[]
  /** سطح فعالیت روزانه برای ActivityHeatmap (هر عدد بین ۰ تا ۴) */
  activity: number[]
  /** اعضای پروژه — از اعضای سازمان مالک پروژه مشتق می‌شود (رجوع به `getProject`)، نه فیلد مستقل Mock */
  members: OrganizationMember[]
  /** ساعت آخرین به‌روزرسانی نمودار «فعالیت اعضا» به‌صورت ۲۴ساعته "HH:MM" — فعلاً Mock ثابت */
  activityUpdatedAt: string
}

export type Division = {
  id: string
  organizationId: string
  name: string
  projects: ProjectRef[]
}

export type Organization = {
  id: string
  name: string
  slug?: string
  description?: string
  imageUrl?: string
  preferences?: Record<string, unknown>
  currentUserRole?: OrganizationMember["role"]
  currentUserPermissions?: Record<string, boolean>
  /** تاریخ ساخت سازمان (جلالی، رقم لاتین — مثل بقیه‌ی تاریخ‌های این مدل) */
  createdAt: string
  members: OrganizationMember[]
  divisions: Division[]
  /** نمای تجمیعی پروژه‌های معاونت‌ها برای گزارش‌ها */
  projects: ProjectRef[]
  taskCount: number
}

export type NotificationStatus = "unread" | "read"

export type NotificationTarget =
  | { type: "task"; id: string; label: string; projectId: string }
  | { type: "ticket"; id: string; label: string; projectId?: string }
  | { type: "project"; id: string; label: string }
  | { type: "organization"; id: string; label: string }

/**
 * نوع رخداد اعلان — کلید ترجمه است، نه متن آماده، تا با تغییر زبان محتوای اعلان هم عوض شود
 * (رجوع به `src/lib/i18n/dictionary.ts` کلیدهای `notifications.verb.*`).
 */
export type NotificationVerb =
  | "taskAssigned"
  | "ticketAssigned"
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
  createdAt: RelativeTime | string
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

/** فایلی که کاربر به پروفایل خودش پیوست کرده — در Overview صفحهٔ «تسک‌های من» نمایش داده می‌شود. */
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
 * «حساب کاربری»، در Overview صفحهٔ «تسک‌های من» هم استفاده خواهند شد.
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
  /** فایل‌های پیوست‌شده‌ی کاربر (بخش پروفایل در Overview صفحهٔ «تسک‌های من») */
  attachments: UserAttachment[]
}

/** A browser session belonging to the signed-in account. The token itself is never returned. */
export type AuthSession = {
  id: string
  deviceType: "mobile" | "tablet" | "desktop" | "unknown"
  browser: string
  createdAt: string
  lastSeenAt: string
  expiresAt: string
  isCurrent: boolean
}

/** تسک تخصیص‌داده‌شده به کاربر، به‌همراه پروژه‌ای که از آن آمده (چون لیست بین‌پروژه‌ای است). */
export type MyTask = Task & {
  projectId: string
  projectName: string
}

/**
 * داده‌ی تجمیعی Overview صفحهٔ «تسک‌های من» — همان مفاهیم سطح پروژه، اما روی همه‌ی
 * پروژه‌های کاربر (رجوع به docs/PRODUCT_OVERVIEW.md بخش «تسک‌های من»).
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
  projectId?: string
  title: string
  assigneeNames?: string[]
  dueDate?: string
  startDate?: string
  recurrence?: TaskRecurrence
  repeat?: RepeatOption
  priority: TaskPriority
  status: TaskStatus
  tags: string[]
  description?: string
  followers: string[]
  isFavorite: boolean
  timeSpentMinutes: number
  subtasks?: Task[]
}

/** ورودی ساخت تسک جدید (فرم `features/tasks/TaskCreateForm`). */
export type NewTaskInput = {
  title: string
  projectId: string
  assigneeNames?: string[]
  dueDate?: string
  startDate?: string
  recurrence?: TaskRecurrence
  repeat?: RepeatOption
  priority: TaskPriority
  tags: string[]
  description?: string
  status?: TaskStatus
  followers?: string[]
  isFavorite?: boolean
  timeSpentMinutes?: number
  subtasks?: { title: string }[]
}

/** یک گزینه‌ی پروژه در فرم ساخت تسک، به‌همراه اعضایی که می‌توانند مسئول تسک شوند. */
/** یک عضو قابل‌انتخاب در سلکت «مسئول» فرم ساخت تسک — رجوع به `TaskFormProjectOption`. */
export type TaskFormMemberOption = {
  id: string
  name: string
  avatarUrl?: string
}

export type TaskFormProjectOption = {
  id: string
  name: string
  slug?: string
  organizationSlug?: string
  organizationName: string
  members: TaskFormMemberOption[]
}

export type TicketSubject = "hr" | "purchasing" | "warehouse" | "general"
export type TicketStatus = TaskStatus
export type TicketPermission = "salary-payment" | "purchase" | "warehouse-release" | "other"
export type TicketPriority = TaskPriority
export type NewTicketInput = {
  projectId?: string
  createdById?: string
  createdByName?: string
  createdByAvatarUrl?: string
  /** تیکت در هر زمان حداکثر به یک عضو ارجاع می‌شود. */
  assigneeId?: string
  assigneeName?: string
  assigneeAvatarUrl?: string
  title: string
  subject: TicketSubject
  status: TicketStatus
  permissionIds: TicketPermission[]
  priority?: TicketPriority
  description?: string
  followers?: string[]
  favorites?: string[]
}

export type TicketActivity = { id: string; ticketId: string; actorId: string; actorName: string; actorAvatarUrl?: string; kind: "created" | "updated" | "assigned" | "status_changed" | "following" | "favorite" | "comment"; details: Record<string, unknown>; createdAt: string }

export type TicketComment = {
  id: string
  ticketId: string
  authorId: string
  authorName: string
  authorAvatarUrl?: string
  text: string
  /** Timestamp generated by the API server in ISO 8601 UTC format. */
  createdAt: string
}

export type NewTicketCommentInput = {
  authorId: string
  authorName: string
  authorAvatarUrl?: string
  text: string
}
