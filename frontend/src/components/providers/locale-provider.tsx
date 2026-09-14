"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { LOCALE_COOKIE, t, type Locale, type TranslationKey } from "@/lib/i18n/dictionary"

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

/**
 * زبان روی کوکی `locale` ذخیره می‌شود (نه فقط state کلاینت) تا Server Component ها
 * (صفحات `page.tsx`) هم بتوانند همان لحظه‌ی رندر سرور، با `getLocale()` از
 * `src/lib/i18n/server.ts`، زبان درست را بخوانند — بدون این، سوییچ زبان فقط متن‌های
 * سمت کلاینت را عوض می‌کرد نه عنوان صفحه‌هایی که در Server Component ساخته می‌شوند.
 * `setLocale` هم کوکی را می‌نویسد هم بلافاصله state کلاینت را عوض می‌کند (برای واکنش فوری
 * کامپوننت‌های Client مثل نوار ناوبری) و در نهایت `router.refresh()` صفحات سرور را با
 * زبان جدید دوباره می‌رندر می‌کند.
 */
export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale
  children: React.ReactNode
}) {
  const router = useRouter()
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000`
      setLocaleState(next)
      router.refresh()
    },
    [router]
  )

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: (key: TranslationKey) => t(locale, key) }),
    [locale, setLocale]
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error("useLocale باید داخل LocaleProvider استفاده شود")
  return context
}

/** میان‌بر رایج: فقط تابع ترجمه، بدون locale/setLocale. */
export function useT() {
  return useLocale().t
}
