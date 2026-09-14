"use client"

import { DirectionProvider } from "@/components/ui/direction"
import { localeDir, type Locale } from "@/lib/i18n/dictionary"
import type { Theme } from "@/lib/theme"
import { LocaleProvider, useLocale } from "./locale-provider"
import { ThemeProvider } from "./theme-provider"

/** جهت (`rtl`/`ltr`) را از زبان جاری می‌گیرد و به `DirectionProvider` (Base UI) می‌دهد. */
function DirectionFromLocale({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale()
  return <DirectionProvider direction={localeDir(locale)}>{children}</DirectionProvider>
}

/** پوسته‌ی مشترک Provider های کلاینت — از `src/app/layout.tsx` (Server Component) صدا زده می‌شود. */
export function AppProviders({
  initialLocale,
  initialTheme,
  children,
}: {
  initialLocale: Locale
  initialTheme: Theme
  children: React.ReactNode
}) {
  return (
    <LocaleProvider initialLocale={initialLocale}>
      <ThemeProvider initialTheme={initialTheme}>
        <DirectionFromLocale>{children}</DirectionFromLocale>
      </ThemeProvider>
    </LocaleProvider>
  )
}
