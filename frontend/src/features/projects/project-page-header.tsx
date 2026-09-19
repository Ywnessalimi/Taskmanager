"use client"

import { PageHeader, type PageHeaderMenuItem } from "@/components/navigation/page-header"
import { useTaskPanel } from "@/components/providers/task-panel-provider"

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
  menu,
}: {
  title: string
  subtitle?: string
  menu?: PageHeaderMenuItem[][]
}) {
  const panelOpen = Boolean(useTaskPanel()?.panel)

  return (
    <div className={panelOpen ? "hidden lg:block" : undefined}>
      <PageHeader title={title} subtitle={subtitle} menu={menu} />
    </div>
  )
}
