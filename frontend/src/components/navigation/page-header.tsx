"use client"

import { useRouter } from "next/navigation"
import { useLocale } from "@/components/providers/locale-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RemixIcon } from "@/components/ui/remix-icon"
import { localeDir } from "@/lib/i18n/dictionary"

export type PageHeaderMenuItem = {
  label: string
  icon: string
  onClick?: () => void
  destructive?: boolean
}

/**
 * هدر مشترک صفحات جزئیات (سازمان، پروژه، تسک جدید): دکمه‌ی بازگشت، عنوان، و منوی سه‌نقطه.
 * مثل `components/layout/AppHeader` سفید و تمام‌عرض است، پس باید بیرون از کانتینر
 * padding‌دار صفحه رندر شود. جهت فلش بازگشت از جهت زبان جاری می‌آید (راست در RTL، چپ در
 * LTR) — نه ثابت.
 */
export function PageHeader({
  title,
  subtitle,
  /** هر آرایه‌ی داخلی یک گروه است؛ بین گروه‌ها جداکننده رسم می‌شود. */
  menu,
}: {
  title: string
  subtitle?: string
  menu?: PageHeaderMenuItem[][]
}) {
  const router = useRouter()
  const { locale, t } = useLocale()
  const backIcon = localeDir(locale) === "rtl" ? "arrow-right-line" : "arrow-left-line"

  return (
    <header className="flex min-h-13 items-center gap-1 border-b border-border bg-background px-4 py-2">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label={t("pageHeader.back")}
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-icon2 hover:bg-bg2 hover:text-icon"
      >
        <RemixIcon name={backIcon} className="text-lg" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-medium text-foreground">{title}</h1>
        {subtitle && <p className="truncate text-xs text-text2">{subtitle}</p>}
      </div>

      {menu && menu.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t("pageHeader.moreOptions")}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-icon2 hover:bg-bg2 hover:text-icon"
          >
            <RemixIcon name="more-line" className="text-lg" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {menu.map((group, groupIndex) => (
              <div key={groupIndex}>
                {groupIndex > 0 && <DropdownMenuSeparator />}
                {group.map((item) => (
                  <DropdownMenuItem
                    key={item.label}
                    variant={item.destructive ? "destructive" : "default"}
                    onClick={item.onClick}
                  >
                    <RemixIcon name={item.icon} className="text-base" />
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  )
}
