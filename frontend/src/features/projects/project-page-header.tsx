"use client"

import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/navigation/page-header"
import { useTaskPanel } from "@/components/providers/task-panel-provider"
import { useT } from "@/components/providers/locale-provider"

/**
 * پوسته‌ی نازک روی `PageHeader` مخصوص صفحه‌ی پروژه — تنها مصرف‌کننده‌اش
 * `app/(tabs)/home/projects/[id]/page.tsx` است.
 *
 * زیر breakpoint `lg` وقتی پنل تسک (ساخت/جزئیات) باز است، `SectionTabs` تب‌های
 * لیست/نمای‌کلی را پنهان و `TaskPanel` را تمام‌عرض می‌کند (رجوع به `features/pages/section-tabs.tsx`)
 * — یعنی کاربر روی موبایل عملاً وارد یک «صفحه»ی دیگر شده، پس هدر پروژه (که همیشه رندر شده
 * بود و بالای پنل می‌نشست) باید موقتاً پنهان شود، وگرنه کاربر دو هدر روی هم می‌بیند. از `lg`
 * به بالا پنل کنار لیست می‌نشیند نه رویش، پس آنجا هدر همیشه دیده می‌شود — طبق بازخورد کاربر
 * این تغییر عمداً هیچ اثری روی نسخه‌ی دسکتاپ ندارد (`lg:block` رفتار پیش‌فرض را برمی‌گرداند).
 */
export function ProjectPageHeader({
  title,
  subtitle,
  projectId,
  isAdmin,
}: {
  title: string
  subtitle?: string
  projectId: string
  /** فقط ادمین‌های همان سازمان اجازه‌ی حذف پروژه را دارند — رجوع به `page.tsx` (تطبیق نام کاربر جاری با نقشش در `project.members`). */
  isAdmin: boolean
}) {
  const panel = useTaskPanel()
  const panelOpen = Boolean(panel?.panel)
  const router = useRouter()
  const t = useT()

  return (
    <div className={panelOpen ? "hidden lg:block" : undefined}>
      <PageHeader
        title={title}
        subtitle={subtitle}
        menu={[
          [
            {
              label: t("project.addTask"),
              icon: "task-line",
              onClick: () => panel?.openNewTask(),
            },
          ],
          [
            {
              label: t("project.settings"),
              icon: "settings-3-line",
              onClick: () => router.push(`/home/projects/${projectId}/settings`),
            },
          ],
          ...(isAdmin
            ? [[{ label: t("project.delete"), icon: "delete-bin-line", destructive: true }]]
            : []),
        ]}
      />
    </div>
  )
}
