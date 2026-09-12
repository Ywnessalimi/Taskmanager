"use client"

import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RemixIcon } from "@/components/ui/remix-icon"

export type PageHeaderMenuItem = {
  label: string
  icon: string
  onClick?: () => void
  destructive?: boolean
}

/**
 * هدر مشترک صفحات جزئیات (سازمان، پروژه، تسک جدید): دکمه‌ی بازگشت (فلش رو‌به‌راست، چون RTL)،
 * عنوان، و منوی سه‌نقطه. مثل `components/layout/AppHeader` سفید و تمام‌عرض است، پس باید
 * بیرون از کانتینر padding‌دار صفحه رندر شود.
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

  return (
    <header className="flex min-h-13 items-center gap-1 border-b border-border bg-background px-4 py-2">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="بازگشت"
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-icon2 hover:bg-bg2 hover:text-icon"
      >
        <RemixIcon name="arrow-right-line" className="text-lg" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-medium text-foreground">{title}</h1>
        {subtitle && <p className="truncate text-xs text-text2">{subtitle}</p>}
      </div>

      {menu && menu.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="گزینه‌های بیشتر"
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
