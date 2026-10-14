"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { useT } from "@/components/providers/locale-provider"
import { RemixIcon } from "@/components/ui/remix-icon"
import { AIAssistantDialog } from "@/features/ai/ai-assistant-dialog"
import { cn } from "cn"

const item = "flex w-full flex-col items-center gap-0.5 text-[11px] leading-4"

/** مینی‌بار دسکتاپ؛ موقعیت آن از جهت سراسری صفحه پیروی می‌کند. */
export function SidebarNav() {
  const pathname = usePathname()
  const t = useT()
  const projectsActive = pathname === "/projects" || pathname.includes("/projects/")
  const inboxActive = pathname === "/inbox" || pathname.startsWith("/inbox/")
  const accountActive = pathname === "/account" || pathname.startsWith("/account/")

  return (
    <aside data-slot="sidebar-nav" className="hidden w-20 shrink-0 bg-background py-3 ps-3 lg:flex">
      <nav aria-label={t("miniBar.navigation")} className="flex min-h-[calc(100vh-24px)] w-full flex-col items-center justify-between rounded-2xl border border-[var(--mini-bar-border)] bg-[var(--mini-bar-bg)] px-2 py-5 text-white">
        <div className="flex w-full flex-col items-center gap-6">
          <Link href="/inbox" aria-current={inboxActive ? "page" : undefined} className={cn(item, inboxActive ? "font-semibold text-white" : "text-[var(--mini-bar-muted)]")}><RemixIcon name={inboxActive ? "home-smile-fill" : "home-smile-line"} className="text-2xl" />{t("miniBar.inbox")}</Link>
          <Link href="/projects" aria-current={projectsActive ? "page" : undefined} className={cn(item, projectsActive ? "font-semibold text-white" : "text-[var(--mini-bar-muted)]")}><RemixIcon name={projectsActive ? "dashboard-fill" : "dashboard-line"} className="text-2xl" />{t("miniBar.projects")}</Link>
          <Dialog><DialogTrigger className={cn(item, "text-[var(--mini-bar-muted)] hover:text-white")} aria-label={t("aiAssistant.aria")}><RemixIcon name="brain-line" className="text-2xl" />{t("aiAssistant.title")}</DialogTrigger><AIAssistantDialog /></Dialog>
          <span aria-disabled="true" className={cn(item, "text-[var(--mini-bar-muted)]")}><RemixIcon name="team-line" className="text-2xl" />{t("miniBar.teams")}</span>
        </div>
        <div className="flex w-full flex-col items-center gap-4 border-t border-[var(--mini-bar-border)] pt-4">
          <Link href="/account" aria-current={accountActive ? "page" : undefined} className={cn(item, accountActive ? "font-semibold text-white" : "text-[var(--mini-bar-muted)]")}><Image src="/avatars/u1.svg" alt="" width={24} height={24} className={cn("size-6 rounded-full object-cover", accountActive && "ring-1 ring-white")} />{t("miniBar.profile")}</Link>
          <span aria-disabled="true" className={cn(item, "text-[var(--mini-bar-muted)]")}><RemixIcon name="settings-3-line" className="text-2xl" />{t("miniBar.settings")}</span>
        </div>
      </nav>
    </aside>
  )
}
