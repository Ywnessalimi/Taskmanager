"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useT } from "@/components/providers/locale-provider"
import { RemixIcon } from "@/components/ui/remix-icon"
import { WorkspaceList } from "@/features/home/workspace-list"
import type { Organization } from "@/lib/api/types"
import type { TranslationKey } from "@/lib/i18n/dictionary"
import { cn } from "cn"

const NAV_ITEMS = [
  { href: "/my-tasks", labelKey: "nav.myTasks", icon: "task" },
] satisfies { href: string; labelKey: TranslationKey; icon: string }[]

/**
 * ناوبری کناری برای نسخه‌ی دسکتاپ — جایگزین `BottomTabBar` از breakpoint `lg` به بالا
 * (رجوع به `components/navigation/README.md` و docs/DESIGN.md بخش ۸.۱). چون اپ RTL است، به‌عنوان
 * اولین فرزند یک ردیف flex قرار می‌گیرد و طبیعتاً سمت راست می‌نشیند؛ `border-e` هم لبه‌ی سمت چپش
 * (مرز با محتوا) را مشخص می‌کند.
 *
 * برخلاف `BottomTabBar` (۴ آیتم مساوی)، اینجا «خانه» و «اعلان‌ها»/«حساب کاربری»/«تسک جدید» دیگر
 * اینجا نیستند: اعلان‌ها/حساب کاربری/تسک جدید به `components/navigation/desktop-header.tsx`
 * (هدر مستقل بالای محتوا، نه ساید‌بار) منتقل شده‌اند، و «خانه» با نمایش مستقیم `WorkspaceList`
 * (همان فهرست سازمان‌ها/پروژه‌های صفحه‌ی خانه‌ی موبایل) جایگزین شده. فقط «تسک‌های من» به‌صورت
 * آیتم معمولی باقی مانده است.
 */
export function SidebarNav({ organizations }: { organizations: Organization[] }) {
  const pathname = usePathname()
  const t = useT()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <aside
      data-slot="sidebar-nav"
      className="hidden w-60 shrink-0 flex-col border-e border-border bg-background lg:flex"
    >
      <div className="flex h-13 items-center px-4">
        <span className="text-base font-medium text-foreground">Quire</span>
      </div>

      <nav className="flex flex-col gap-0.5 px-3 pb-2">
        {NAV_ITEMS.map(({ href, labelKey, icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex h-9 items-center gap-2 rounded-md px-2.5 text-sm",
                active ? "bg-bg2 text-brand" : "text-text2 hover:bg-bg2 hover:text-foreground"
              )}
            >
              <RemixIcon name={`${icon}-${active ? "fill" : "line"}`} className="text-lg" />
              {t(labelKey)}
            </Link>
          )
        })}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto border-t border-border px-3 pt-2">
        <WorkspaceList organizations={organizations} showProgress={false} />
      </div>
    </aside>
  )
}
