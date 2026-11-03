"use client"

import { DirectionProvider } from "@/components/ui/direction"
import { localeDir, type Locale } from "@/lib/i18n/dictionary"
import { LocaleProvider, useLocale } from "./locale-provider"

/** جهت (`rtl`/`ltr`) را از زبان جاری می‌گیرد و به `DirectionProvider` (Base UI) می‌دهد. */
function DirectionFromLocale({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale()
  return <DirectionProvider direction={localeDir(locale)}>{children}</DirectionProvider>
}

/** پوسته‌ی مشترک Provider های کلاینت — از `src/app/layout.tsx` (Server Component) صدا زده می‌شود. */
export function AppProviders({
  initialLocale,
  children,
}: {
  initialLocale: Locale
  children: React.ReactNode
}) {
  return (
    <LocaleProvider initialLocale={initialLocale}>
      <DirectionFromLocale>{children}</DirectionFromLocale>
    </LocaleProvider>
  )
}
