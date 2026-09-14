"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useT } from "@/components/providers/locale-provider"
import { RemixIcon } from "@/components/ui/remix-icon"
import type { TranslationKey } from "@/lib/i18n/dictionary"
import { cn } from "cn"

const NAV_ITEMS = [
  { href: "/home", labelKey: "nav.home", icon: "home" },
  { href: "/my-tasks", labelKey: "nav.myTasks", icon: "task" },
  { href: "/notifications", labelKey: "nav.notifications", icon: "notification" },
  { href: "/account", labelKey: "nav.account", icon: "account-circle" },
] satisfies { href: string; labelKey: TranslationKey; icon: string }[]

/**
 * ناوبری کناری برای نسخه‌ی دسکتاپ — جایگزین `BottomTabBar` از breakpoint `lg` به بالا
 * (رجوع به `components/navigation/README.md`). چون اپ RTL است، به‌عنوان اولین فرزند
 * یک ردیف flex قرار می‌گیرد و طبیعتاً سمت راست می‌نشیند؛ `border-e` هم لبه‌ی سمت چپش
 * (مرز با محتوا) را مشخص می‌کند.
 */
export function SidebarNav() {
  const pathname = usePathname()
  const t = useT()

  return (
    <aside
      data-slot="sidebar-nav"
      className="hidden w-60 shrink-0 flex-col border-e border-border bg-background lg:flex"
    >
      <div className="flex h-13 items-center px-4">
        <span className="text-base font-medium text-foreground">Quire</span>
      </div>

      <div className="px-3 pb-3">
        <Link
          href="/tasks/new"
          className="flex h-9 items-center justify-center gap-1.5 rounded-md bg-brand px-2.5 text-sm font-medium text-text-on-brand hover:opacity-90"
        >
          <RemixIcon name="add-line" className="text-base" />
          {t("nav.newTask")}
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {NAV_ITEMS.map(({ href, labelKey, icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          const label = t(labelKey)

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
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
