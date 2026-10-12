"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useT } from "@/components/providers/locale-provider"
import { AIAssistantDialog } from "@/features/ai/ai-assistant-dialog"
import { cn } from "cn"

/** مینی‌بار موبایل طرح KalaMarket؛ مدخل‌های فاقد مقصد عمداً غیرفعال‌اند. */
export function BottomTabBar() {
  const pathname = usePathname()
  const t = useT()
  const projectsActive = pathname === "/projects" || pathname.includes("/projects/")
  const itemClass = "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] leading-4"

  return (
    <nav aria-label={t("miniBar.navigation")} data-slot="bottom-tab-bar" className="fixed inset-x-2 bottom-2 z-50 flex h-16 items-stretch rounded-2xl border border-[var(--mini-bar-border)] bg-[var(--mini-bar-bg)] px-2 text-white lg:hidden">
      <Link href="/inbox" aria-current={pathname === "/inbox" ? "page" : undefined} className={cn(itemClass, pathname === "/inbox" ? "font-semibold text-white" : "text-[var(--mini-bar-muted)]")}><RemixIcon name="home-smile-line" className="text-2xl" />{t("miniBar.inbox")}</Link>
      <Link href="/projects" aria-current={projectsActive ? "page" : undefined} className={cn(itemClass, projectsActive ? "font-semibold text-white" : "text-[var(--mini-bar-muted)]")}><RemixIcon name={projectsActive ? "dashboard-fill" : "dashboard-line"} className="text-2xl" />{t("miniBar.projects")}</Link>
      <Dialog><DialogTrigger className={cn(itemClass, "text-[var(--mini-bar-muted)] hover:text-white")} aria-label={t("aiAssistant.aria")}><RemixIcon name="brain-line" className="text-2xl" />{t("aiAssistant.title")}</DialogTrigger><AIAssistantDialog /></Dialog>
      <span aria-disabled="true" className={cn(itemClass, "text-[var(--mini-bar-muted)]")}><RemixIcon name="notification-3-line" className="text-2xl" />{t("nav.notifications")}</span>
      <span aria-disabled="true" className={cn(itemClass, "text-[var(--mini-bar-muted)]")}><Image src="/avatars/u1.svg" alt="" width={24} height={24} className="size-6 rounded-full object-cover" />{t("miniBar.profile")}</span>
    </nav>
  )
}
