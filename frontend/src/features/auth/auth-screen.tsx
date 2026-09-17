import { t, type Locale } from "@/lib/i18n/dictionary"
import { AuthHero } from "./auth-hero"
import { AuthModeToggle } from "./auth-mode-toggle"

/**
 * پوسته‌ی مشترک صفحه‌ی ورود/ثبت‌نام — از طرح Figma «AlignUI» (نودهای log-in موبایل/دسکتاپ
 * و Sign up) گرفته شده. روی موبایل فقط کارت فرم تمام‌صفحه‌ی سفید است؛ از `lg` به بالا یک
 * چیدمان دو ستونه می‌شود: عکس زمینه‌ی برند سمت شروع (`AuthHero`) و کارت فرم با عرض ثابت
 * ۴۰۰px سمت پایان. عکس زمینه بین ورود/ثبت‌نام فرق می‌کند، برای همین به‌جای Next layout.tsx
 * مشترک، این کامپوننت با `heroImage` پارامتری شده و مستقیم در هر دو `page.tsx` صدا زده
 * می‌شود.
 */
export function AuthScreen({
  locale,
  active,
  heroImage,
  children,
}: {
  locale: Locale
  active: "login" | "signup"
  heroImage: string
  children: React.ReactNode
}) {
  return (
    <div className="auth-theme flex min-h-dvh w-full bg-[var(--auth-bg)] lg:bg-[#ededed]">
      <AuthHero locale={locale} imageSrc={heroImage} />
      <div className="flex w-full flex-1 items-center justify-center lg:w-[400px] lg:flex-none lg:p-2.5">
        <div className="flex w-full max-w-[360px] flex-col gap-4 rounded-[20px] bg-[var(--auth-bg)] px-5 pt-[70px] pb-5 lg:pt-10 lg:pb-[30px]">
          <div className="flex w-full flex-col gap-2 text-end">
            <p className="text-lg text-[color:var(--auth-text-primary)]">{t(locale, "auth.welcomeTitle")}</p>
            <p className="text-sm text-[color:var(--auth-text-tertiary)]">
              {t(locale, "auth.welcomeSubtitle")}
            </p>
          </div>
          <AuthModeToggle locale={locale} active={active} />
          {children}
        </div>
      </div>
    </div>
  )
}
