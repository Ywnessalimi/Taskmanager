"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { useT } from "@/components/providers/locale-provider"
import { RemixIcon } from "@/components/ui/remix-icon"
import { AIAssistantDialog } from "@/features/ai/ai-assistant-dialog"
import type { TranslationKey } from "@/lib/i18n/dictionary"
import { cn } from "cn"

const TABS_BEFORE_AI = [
  { href: "/home", labelKey: "nav.home", icon: "home" },
  { href: "/my-tasks", labelKey: "nav.myTasks", icon: "task" },
] satisfies { href: string; labelKey: TranslationKey; icon: string }[]

const TABS_AFTER_AI = [
  { href: "/notifications", labelKey: "nav.notifications", icon: "notification" },
  { href: "/account", labelKey: "nav.account", icon: "account-circle" },
] satisfies { href: string; labelKey: TranslationKey; icon: string }[]

function TabLink({ href, labelKey, icon, active }: { href: string; labelKey: TranslationKey; icon: string; active: boolean }) {
  const t = useT()

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px]",
        active ? "text-brand" : "text-text2"
      )}
    >
      <RemixIcon name={`${icon}-${active ? "fill" : "line"}`} className="text-lg" />
      {t(labelKey)}
    </Link>
  )
}

/** آیتم وسط نوار — دقیقاً بین «تسک‌های من» و «اعلان‌ها»، طبق بازخورد کاربر؛ برخلاف بقیه لینک نیست، همان `AIAssistantDialog` مشترک با `AIAssistantFab` دسکتاپ را باز می‌کند (دو `Dialog` جدا، چون این کامپوننت فقط زیر `lg` و آن فقط از `lg` به بالا دیده می‌شود، پس هیچ‌وقت هم‌زمان mount نیستند). */
function AITabItem() {
  const t = useT()

  return (
    <Dialog>
      <DialogTrigger
        aria-label={t("aiAssistant.aria")}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] text-text2"
      >
        <Image src="/images/ai/assistant-icon.png" alt="" width={22} height={22} className="size-[22px]" />
        {t("aiAssistant.title")}
      </DialogTrigger>
      <AIAssistantDialog />
    </Dialog>
  )
}

export function BottomTabBar() {
  const pathname = usePathname()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <nav
      data-slot="bottom-tab-bar"
      className="fixed inset-x-0 bottom-0 z-50 flex h-14 items-stretch border-t border-border bg-background lg:hidden"
    >
      {TABS_BEFORE_AI.map((tab) => (
        <TabLink key={tab.href} {...tab} active={isActive(tab.href)} />
      ))}
      <AITabItem />
      {TABS_AFTER_AI.map((tab) => (
        <TabLink key={tab.href} {...tab} active={isActive(tab.href)} />
      ))}
    </nav>
  )
}
