import { t, type Locale } from "@/lib/i18n/dictionary"
import { AuthHero } from "./auth-hero"

/**
 * پوسته‌ی مشترک صفحه‌ی ورود/ثبت‌نام — از طرح Figma «AlignUI» (نودهای log-in موبایل/دسکتاپ
 * و Sign up) گرفته شده. روی موبایل فقط کارت فرم تمام‌صفحه‌ی سفید است؛ از `lg` به بالا یک
 * چیدمان دو ستونه می‌شود: عکس زمینه‌ی برند سمت شروع (`AuthHero`) و سطح تمام‌ارتفاع
 * فرم با عرض ۴۰۰px سمت پایان. عکس زمینه بین ورود/ثبت‌نام فرق می‌کند، برای همین به‌جای Next layout.tsx
 * مشترک، این کامپوننت با `heroImage` پارامتری شده و مستقیم در هر دو `page.tsx` صدا زده
 * می‌شود.
 */
export function AuthScreen({
  locale,
  heroImage,
  children,
}: {
  locale: Locale
  heroImage: string
  children: React.ReactNode
}) {
  return (
    <div
      className="auth-theme flex min-h-dvh w-full bg-[var(--auth-bg)] lg:bg-[#ededed]"
      style={{ flexDirection: locale === "fa" ? "row-reverse" : "row" }}
    >
      <AuthHero locale={locale} imageSrc={heroImage} />
      <div className="flex w-full flex-1 items-center justify-center lg:min-h-dvh lg:w-[400px] lg:flex-none">
        <div className="flex w-full max-w-[360px] flex-col gap-4 rounded-[20px] bg-[var(--auth-bg)] px-5 pt-[70px] pb-5 lg:min-h-dvh lg:max-w-none lg:justify-center lg:rounded-none lg:py-0">
          <div className="flex w-full flex-col gap-2 text-end">
            <p className="text-lg text-[color:var(--auth-text-primary)]">{t(locale, "auth.welcomeTitle")}</p>
            <p className="text-sm text-[color:var(--auth-text-tertiary)]">
              {t(locale, "auth.welcomeSubtitle")}
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
