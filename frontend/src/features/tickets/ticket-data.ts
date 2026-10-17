import type { Locale } from "@/lib/i18n/dictionary"
import { readLocalTickets, type LocalTicket } from "./local-created-tickets"

const mockOwners: Record<string, string> = {
  u1: "سارا احمدی",
  u2: "علی رضایی",
  u3: "مریم کریمی",
}

const mockTicketData = [
  { id: "ticket-example-1", subject: "hr", status: "todo", permissionIds: ["salary-payment"], createdById: "u1", assigneeId: "u2", titleFa: "مجوز واریز حقوق", titleEn: "Payroll authorization" },
  { id: "ticket-example-2", subject: "purchasing", status: "in-progress", permissionIds: ["purchase"], createdById: "u2", assigneeId: "u3", titleFa: "خرید تجهیزات اداری", titleEn: "Office equipment purchase" },
  { id: "ticket-example-3", subject: "warehouse", status: "completed", permissionIds: ["warehouse-release"], createdById: "u3", titleFa: "خروج کالا از انبار", titleEn: "Warehouse dispatch" },
  { id: "ticket-example-4", subject: "general", status: "todo", permissionIds: ["other"], createdById: "u2", assigneeId: "u1", titleFa: "درخواست دسترسی", titleEn: "Access request" },
  { id: "ticket-example-5", subject: "hr", status: "in-progress", permissionIds: ["salary-payment"], createdById: "u3", assigneeId: "u1", titleFa: "بررسی حقوق ماهانه", titleEn: "Monthly payroll review" },
  { id: "ticket-example-6", subject: "hr", status: "todo", permissionIds: ["salary-payment"], createdById: "u1", titleFa: "پرداخت قرارداد پشتیبانی", titleEn: "Support contract payment" },
  { id: "ticket-example-7", subject: "purchasing", status: "todo", permissionIds: ["purchase"], createdById: "u2", assigneeId: "u3", titleFa: "خرید مانیتور برای تیم", titleEn: "Monitors for the team" },
  { id: "ticket-example-8", subject: "warehouse", status: "in-progress", permissionIds: ["warehouse-release"], createdById: "u3", titleFa: "اصلاح موجودی کالا", titleEn: "Inventory adjustment" },
  { id: "ticket-example-9", subject: "general", status: "completed", permissionIds: ["other"], createdById: "u1", assigneeId: "u2", titleFa: "دسترسی به پنل گزارش", titleEn: "Reports dashboard access" },
  { id: "ticket-example-10", subject: "purchasing", status: "in-progress", permissionIds: ["purchase"], createdById: "u2", assigneeId: "u1", titleFa: "تأمین قطعات دستگاه‌ها", titleEn: "Equipment parts purchase" },
  { id: "ticket-example-11", subject: "hr", status: "completed", permissionIds: ["salary-payment"], createdById: "u3", titleFa: "تأیید فهرست حقوق", titleEn: "Approve payroll list" },
  { id: "ticket-example-12", subject: "warehouse", status: "todo", permissionIds: ["warehouse-release"], createdById: "u2", assigneeId: "u1", titleFa: "ارسال نمونه از انبار", titleEn: "Dispatch warehouse samples" },
  { id: "ticket-example-13", subject: "general", status: "in-progress", permissionIds: ["other"], createdById: "u1", assigneeId: "u3", titleFa: "افزودن دسترسی مدیر پروژه", titleEn: "Add project manager access" },
] as const

const mockAvatars: Record<string, string> = {
  u1: "/avatars/u1.svg",
  u2: "/avatars/u2.svg",
  u3: "/avatars/u3.svg",
}

function examples(locale: Locale): LocalTicket[] {
  const en = locale === "en"
  return mockTicketData.map((ticket) => ({
    id: ticket.id,
    title: en ? ticket.titleEn : ticket.titleFa,
    subject: ticket.subject,
    status: ticket.status,
    permissionIds: [...ticket.permissionIds],
    createdById: ticket.createdById,
    createdByName: mockOwners[ticket.createdById],
    createdByAvatarUrl: mockAvatars[ticket.createdById],
    assigneeId: "assigneeId" in ticket ? ticket.assigneeId : undefined,
    assigneeName: "assigneeId" in ticket ? mockOwners[ticket.assigneeId] : undefined,
    assigneeAvatarUrl: "assigneeId" in ticket ? mockAvatars[ticket.assigneeId] : undefined,
    createdAt: "2026-10-11T09:00:00Z",
    updatedAt: "2026-10-11T09:00:00Z",
  }))
}

/** تیکت‌های نمونه و محلی که در کارتابل و Board صفحهٔ MyTasks مشترک نمایش داده می‌شوند. */
export function getTickets(locale: Locale): LocalTicket[] {
  const local = readLocalTickets()
  const deleted: string[] = JSON.parse(localStorage.getItem("quire:deleted-tickets:v1") ?? "[]")
  return [
    ...examples(locale).filter((ticket) => !local.some((item) => item.id === ticket.id)),
    ...local,
  ].filter((ticket) => !deleted.includes(ticket.id))
}
