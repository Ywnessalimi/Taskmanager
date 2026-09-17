import Link from "next/link"
import { cn } from "cn"
import { t, type Locale } from "@/lib/i18n/dictionary"

/**
 * طرح Figma همیشه «ثبت نام» را سمت چپ و «ورود» را سمت راست می‌گذارد (صرف‌نظر از این‌که
 * کدام‌یک فعال است). چون خودِ کانتینر در طرح `dir` نداشت (فقط auto-layout ساده‌ی LTR)، اینجا
 * هم صراحتاً `dir="ltr"` گرفته تا زیر `dir="rtl"` کل اپ معکوس نشود — رجوع به
 * components/navigation/README.md درباره‌ی سورپرایز RTL روی `items-*`/ترتیب فرزندان flex.
 */
export function AuthModeToggle({ locale, active }: { locale: Locale; active: "login" | "signup" }) {
  return (
    <div dir="ltr" className="flex w-full items-start gap-1 rounded-[10px] bg-[var(--auth-bg-tertiary)] p-1">
      <ToggleTab href="/signup" label={t(locale, "auth.tabSignup")} isActive={active === "signup"} />
      <ToggleTab href="/login" label={t(locale, "auth.tabLogin")} isActive={active === "login"} />
    </div>
  )
}

function ToggleTab({ href, label, isActive }: { href: string; label: string; isActive: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 items-center justify-center rounded-[6px] px-2 py-1 text-sm whitespace-nowrap",
        isActive
          ? "bg-[var(--auth-bg)] font-semibold text-[color:var(--auth-text-primary)] shadow-[0_2px_4px_0_rgba(27,28,29,0.04)]"
          : "font-normal text-[color:var(--auth-text-quaternary)]"
      )}
    >
      {label}
    </Link>
  )
}
