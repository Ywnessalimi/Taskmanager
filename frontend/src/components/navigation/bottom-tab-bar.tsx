"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { RemixIcon } from "@/components/ui/remix-icon"
import { cn } from "cn"

const TABS = [
  { href: "/home", label: "خانه", icon: "home" },
  { href: "/my-tasks", label: "تسک‌های من", icon: "task" },
  { href: "/notifications", label: "اعلان‌ها", icon: "notification" },
  { href: "/account", label: "حساب کاربری", icon: "account-circle" },
] as const

export function BottomTabBar() {
  const pathname = usePathname()

  return (
    <nav
      data-slot="bottom-tab-bar"
      className="fixed inset-x-0 bottom-0 z-50 flex h-14 items-stretch border-t border-border bg-background"
    >
      {TABS.map(({ href, label, icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px]",
              active ? "text-brand" : "text-text2"
            )}
          >
            <RemixIcon name={`${icon}-${active ? "fill" : "line"}`} className="text-lg" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
