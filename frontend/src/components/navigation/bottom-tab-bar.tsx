"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useT } from "@/components/providers/locale-provider"
import { RemixIcon } from "@/components/ui/remix-icon"
import type { TranslationKey } from "@/lib/i18n/dictionary"
import { cn } from "cn"

const TABS = [
  { href: "/home", labelKey: "nav.home", icon: "home" },
  { href: "/my-tasks", labelKey: "nav.myTasks", icon: "task" },
  { href: "/notifications", labelKey: "nav.notifications", icon: "notification" },
  { href: "/account", labelKey: "nav.account", icon: "account-circle" },
] satisfies { href: string; labelKey: TranslationKey; icon: string }[]

export function BottomTabBar() {
  const pathname = usePathname()
  const t = useT()

  return (
    <nav
      data-slot="bottom-tab-bar"
      className="fixed inset-x-0 bottom-0 z-50 flex h-14 items-stretch border-t border-border bg-background lg:hidden"
    >
      {TABS.map(({ href, labelKey, icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        const label = t(labelKey)

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
