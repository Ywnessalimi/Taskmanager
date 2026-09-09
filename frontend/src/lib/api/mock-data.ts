import type { Organization, Project } from "./types"

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
      { id: "t1", displayId: "#301", title: "طراحی صفحه‌ی اصلی", assigneeName: "سارا احمدی", priority: "high", dueDate: "1404/05/10", status: "in-progress" },
      { id: "t2", displayId: "#302", title: "پیاده‌سازی فرم تماس", assigneeName: "علی رضایی", priority: "medium", dueDate: "1404/05/14", status: "todo" },
      { id: "t3", displayId: "#303", title: "بهینه‌سازی سرعت بارگذاری", assigneeName: "سارا احمدی", priority: "urgent", dueDate: "1404/05/08", status: "in-progress" },
      { id: "t4", displayId: "#304", title: "تست واکنش‌گرایی موبایل", priority: "low", status: "todo" },
      { id: "t5", displayId: "#305", title: "یکپارچه‌سازی آنالیتیکس", assigneeName: "مریم کریمی", priority: "none", status: "completed" },
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
      { id: "t7", displayId: "#402", title: "اتصال به API نوتیفیکیشن", assigneeName: "مریم کریمی", priority: "medium", status: "in-progress" },
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
    ],
    activity: mockActivity(7),
  },
]

function projectRefs(organizationId: string): { id: string; name: string }[] {
  return MOCK_PROJECTS.filter((p) => p.organizationId === organizationId).map((p) => ({ id: p.id, name: p.name }))
}

export const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: "org-1",
    name: "شرکت نوین‌ساز",
    members: [
      { id: "u1", name: "سارا احمدی", role: "admin", activity: mockMemberActivity(2) },
      { id: "u2", name: "علی رضایی", role: "member", activity: mockMemberActivity(3) },
      { id: "u3", name: "مریم کریمی", role: "member", activity: mockMemberActivity(5) },
      { id: "u4", name: "حسین یوسفی‌نژاد اصفهانی", role: "member", activity: mockMemberActivity(7) },
    ],
    projects: projectRefs("org-1"),
    taskCount: 30,
  },
  {
    id: "org-2",
    name: "تیم طراحی آبی",
    members: [
      { id: "u5", name: "نگار ملکی", role: "admin", activity: mockMemberActivity(4) },
      { id: "u6", name: "امیر صادقی", role: "member", activity: mockMemberActivity(6) },
    ],
    projects: projectRefs("org-2"),
    taskCount: 13,
  },
]
