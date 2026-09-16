import type { CurrentUser, Notification, Organization, Project, ProjectRef } from "./types"

/**
 * یک الگوی شبه‌تصادفی ثابت برای پر کردن نمودارهای فعالیت؛ فقط برای نمایش، بدون معنای واقعی.
 * ضریب ۷ روی i باعث می‌شود حتی وقتی seed مضرب ۵ باشد (مثلاً ۵ یا ۱۰)، خروجی یکنواخت/همه‌صفر نشود.
 */
function mockActivity(seed: number, length = 84): number[] {
  return Array.from({ length }, (_, i) => (i * 7 + seed * 3) % 5)
}

/** طول کوتاه‌تر (۳۰ روز) برای ردیف فعالیت هر عضو در صفحه‌ی سازمان — رجوع به ActivityBarRow */
function mockMemberActivity(seed: number): number[] {
  return mockActivity(seed, 30)
}

export const MOCK_PROJECTS: Project[] = [
  {
    id: "proj-1",
    name: "بازطراحی وب‌سایت",
    organizationId: "org-1",
    organizationName: "شرکت نوین‌ساز",
    startDate: "1404/04/01",
    endDate: "1404/07/15",
    health: { active: 9, completed: 6, dueInPeriod: 3, overdue: 2 },
    statusDistribution: { todo: 5, inProgress: 7, completed: 6 },
    tasks: [
      {
        id: "t1",
        displayId: "#301",
        title: "طراحی صفحه‌ی اصلی",
        assigneeName: "سارا احمدی",
        priority: "high",
        dueDate: "1404/05/10",
        status: "in-progress",
        subtasks: [
          { id: "t1-1", displayId: "#301-1", title: "وایرفریم موبایل", assigneeName: "سارا احمدی", priority: "medium", status: "completed" },
          { id: "t1-2", displayId: "#301-2", title: "طراحی هایفای دسکتاپ", assigneeName: "سارا احمدی", priority: "medium", dueDate: "1404/05/09", status: "in-progress" },
        ],
      },
      { id: "t2", displayId: "#302", title: "پیاده‌سازی فرم تماس", assigneeName: "علی رضایی", priority: "medium", dueDate: "1404/05/14", status: "todo" },
      {
        id: "t3",
        displayId: "#303",
        title: "بهینه‌سازی سرعت بارگذاری",
        assigneeName: "سارا احمدی",
        priority: "urgent",
        dueDate: "1404/05/08",
        status: "in-progress",
        subtasks: [
          { id: "t3-1", displayId: "#303-1", title: "فشرده‌سازی تصاویر", assigneeName: "سارا احمدی", priority: "low", status: "completed" },
        ],
      },
      { id: "t4", displayId: "#304", title: "تست واکنش‌گرایی موبایل", priority: "low", status: "todo" },
      { id: "t5", displayId: "#305", title: "یکپارچه‌سازی آنالیتیکس", assigneeName: "مریم کریمی", priority: "none", status: "completed" },
      { id: "t9", displayId: "#306", title: "تعریف ساختار اطلاعات", assigneeName: "علی رضایی", priority: "medium", dueDate: "1404/04/05", status: "completed" },
      { id: "t10", displayId: "#307", title: "تست پذیرش نهایی", assigneeName: "مریم کریمی", priority: "high", dueDate: "1404/07/10", status: "todo" },
    ],
    activity: mockActivity(3),
  },
  {
    id: "proj-2",
    name: "اپلیکیشن موبایل",
    organizationId: "org-1",
    organizationName: "شرکت نوین‌ساز",
    startDate: "1404/03/01",
    endDate: "1404/09/01",
    health: { active: 12, completed: 4, dueInPeriod: 5, overdue: 1 },
    statusDistribution: { todo: 8, inProgress: 6, completed: 4 },
    tasks: [
      { id: "t6", displayId: "#401", title: "طراحی جریان ثبت‌نام", assigneeName: "علی رضایی", priority: "high", dueDate: "1404/05/20", status: "todo" },
      { id: "t7", displayId: "#402", title: "اتصال به API نوتیفیکیشن", assigneeName: "مریم کریمی", priority: "medium", dueDate: "1404/06/12", status: "in-progress" },
      { id: "t11", displayId: "#403", title: "معماری اولیه‌ی اپ", assigneeName: "علی رضایی", priority: "high", dueDate: "1404/03/15", status: "completed" },
      { id: "t12", displayId: "#404", title: "انتشار نسخه‌ی بتا", assigneeName: "مریم کریمی", priority: "urgent", dueDate: "1404/08/20", status: "todo" },
      { id: "t13", displayId: "#405", title: "طراحی سیستم آیکون اپ", assigneeName: "سارا احمدی", priority: "medium", dueDate: "1404/06/01", status: "in-progress" },
      { id: "t14", displayId: "#406", title: "بازبینی دسترس‌پذیری فرم‌ها", assigneeName: "سارا احمدی", priority: "urgent", dueDate: "1404/05/06", status: "todo" },
    ],
    activity: mockActivity(5),
  },
  {
    id: "proj-3",
    name: "کمپین تبلیغاتی بهار",
    organizationId: "org-2",
    organizationName: "تیم طراحی آبی",
    startDate: "1404/01/10",
    endDate: "1404/03/01",
    health: { active: 2, completed: 10, dueInPeriod: 1, overdue: 0 },
    statusDistribution: { todo: 1, inProgress: 2, completed: 10 },
    tasks: [
      { id: "t8", displayId: "#501", title: "طراحی بنر شبکه‌های اجتماعی", assigneeName: "نگار ملکی", priority: "low", status: "completed" },
      { id: "t15", displayId: "#502", title: "کاور کمپین برای اینستاگرام", assigneeName: "سارا احمدی", priority: "low", dueDate: "1404/02/20", status: "completed" },
      { id: "t16", displayId: "#503", title: "بازطراحی لندینگ کمپین", assigneeName: "سارا احمدی", priority: "high", dueDate: "1404/05/18", status: "in-progress" },
    ],
    activity: mockActivity(7),
  },
]

/** درصد پیشرفت هر پروژه از روی سهم تسک‌های completed، برای ردیف پروژه در صفحه‌ی سازمان. */
function projectRefs(organizationId: string): ProjectRef[] {
  return MOCK_PROJECTS.filter((p) => p.organizationId === organizationId).map((p) => {
    const { todo, inProgress, completed } = p.statusDistribution
    const total = todo + inProgress + completed
    return { id: p.id, name: p.name, progress: total > 0 ? Math.round((completed / total) * 100) : 0 }
  })
}

export const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: "org-1",
    name: "شرکت نوین‌ساز",
    createdAt: "1402/01/11",
    members: [
      { id: "u1", name: "سارا احمدی", role: "admin", activity: mockMemberActivity(2), avatarUrl: "/avatars/u1.svg" },
      { id: "u2", name: "علی رضایی", role: "member", activity: mockMemberActivity(3), avatarUrl: "/avatars/u2.svg" },
      { id: "u3", name: "مریم کریمی", role: "member", activity: mockMemberActivity(5), avatarUrl: "/avatars/u3.svg" },
      {
        id: "u4",
        name: "حسین یوسفی‌نژاد اصفهانی",
        role: "member",
        activity: mockMemberActivity(7),
        avatarUrl: "/avatars/u4.svg",
      },
    ],
    projects: projectRefs("org-1"),
    taskCount: 30,
  },
  {
    id: "org-2",
    name: "تیم طراحی آبی",
    createdAt: "1402/03/20",
    members: [
      { id: "u5", name: "نگار ملکی", role: "admin", activity: mockMemberActivity(4), avatarUrl: "/avatars/u5.svg" },
      { id: "u6", name: "امیر صادقی", role: "member", activity: mockMemberActivity(6), avatarUrl: "/avatars/u6.svg" },
    ],
    projects: projectRefs("org-2"),
    taskCount: 13,
  },
]

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    verb: "taskAssigned",
    actorId: "u1",
    actorName: "سارا احمدی",
    target: { type: "task", id: "t2", label: "پیاده‌سازی فرم تماس", projectId: "proj-1" },
    status: "unread",
    requiresApproval: false,
    createdAt: { unit: "hours", amount: 2 },
  },
  {
    id: "n2",
    verb: "taskCommented",
    actorId: "u2",
    actorName: "علی رضایی",
    target: { type: "task", id: "t3", label: "بهینه‌سازی سرعت بارگذاری", projectId: "proj-1" },
    status: "unread",
    requiresApproval: false,
    createdAt: { unit: "hours", amount: 5 },
  },
  {
    id: "n3",
    verb: "projectJoinRequested",
    actorId: "u6",
    actorName: "امیر صادقی",
    target: { type: "project", id: "proj-1", label: "بازطراحی وب‌سایت" },
    status: "unread",
    requiresApproval: true,
    createdAt: { unit: "yesterday" },
  },
  {
    id: "n4",
    verb: "orgAdminAssigned",
    actorId: "u5",
    actorName: "نگار ملکی",
    target: { type: "organization", id: "org-2", label: "تیم طراحی آبی" },
    status: "unread",
    requiresApproval: true,
    createdAt: { unit: "yesterday" },
  },
  {
    id: "n5",
    verb: "taskStatusChanged",
    verbStatus: "todo",
    actorId: "u2",
    actorName: "علی رضایی",
    target: { type: "task", id: "t6", label: "طراحی جریان ثبت‌نام", projectId: "proj-2" },
    status: "read",
    requiresApproval: false,
    createdAt: { unit: "days", amount: 2 },
  },
  {
    id: "n6",
    verb: "projectCreated",
    actorId: "u5",
    actorName: "نگار ملکی",
    target: { type: "project", id: "proj-3", label: "کمپین تبلیغاتی بهار" },
    status: "read",
    requiresApproval: false,
    createdAt: { unit: "days", amount: 3 },
  },
  {
    id: "n7",
    verb: "orgMemberAdded",
    actorId: "u1",
    actorName: "سارا احمدی",
    target: { type: "organization", id: "org-1", label: "شرکت نوین‌ساز" },
    status: "read",
    requiresApproval: false,
    createdAt: { unit: "week" },
  },
]

/**
 * کاربر واردشده. عمداً همان `u1` (سارا احمدی) از اعضای `org-1` است تا وقتی تب «تسک‌های من»
 * ساخته شد، تسک‌ها و فعالیت او با داده‌ی سازمان/پروژه‌ها هم‌خوان باشد.
 */
export const MOCK_CURRENT_USER: CurrentUser = {
  id: "u1",
  name: "سارا احمدی",
  email: "sara.ahmadi@example.com",
  bio: "طراح محصول در شرکت نوین‌ساز",
  avatarUrl: "/avatars/u1.svg",
  notifications: {
    taskAssigned: true,
    taskComments: true,
    weeklyDigest: false,
  },
  attachments: [
    { id: "f1", name: "رزومه.pdf", sizeLabel: "۱.۲ مگابایت" },
    { id: "f2", name: "قرارداد-همکاری.pdf", sizeLabel: "۸۴۰ کیلوبایت" },
  ],
}

/**
 * «امروز» ثابتِ داده‌ی Mock. چون تاریخ‌ها جلالی و دستی‌اند، مقایسه با تاریخ واقعی سیستم
 * نتیجه‌ی بی‌معنا می‌دهد؛ محاسبه‌ی «عقب‌افتاده» به همین مقدار ثابت تکیه می‌کند.
 * وقتی بک‌اند واقعی آمد، این ثابت حذف و «امروز» از سرور/تقویم واقعی گرفته می‌شود.
 */
export const MOCK_TODAY = "1404/05/12"

/** فعالیت روزانه‌ی خود کاربر واردشده (Portfolio Activity در تب «تسک‌های من»). */
export const MOCK_MY_ACTIVITY = mockActivity(2)
