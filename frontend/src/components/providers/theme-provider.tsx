"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { THEME_COOKIE, type Theme } from "@/lib/theme"

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/**
 * برخلاف زبان، تغییر ظاهر به هیچ محتوای رندرشده‌ی سمت سرور وابسته نیست (فقط یک
 * ویژگی CSS خالص است)، پس نیازی به `router.refresh()` ندارد: مستقیم روی
 * `document.documentElement` اعمال می‌شود (بازخورد فوری) و هم‌زمان در کوکی `theme`
 * ذخیره می‌شود تا رندر بعدی سرور (`src/app/layout.tsx`) همان `data-theme` را از ابتدا
 * روی `<html>` بگذارد و فلش تم اشتباه نداشته باشیم.
 */
export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: Theme
  children: React.ReactNode
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme)

  const setTheme = useCallback((next: Theme) => {
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000`
    if (next === "system") {
      document.documentElement.removeAttribute("data-theme")
    } else {
      document.documentElement.dataset.theme = next
    }
    setThemeState(next)
  }, [])

  const value = useMemo<ThemeContextValue>(() => ({ theme, setTheme }), [theme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useTheme باید داخل ThemeProvider استفاده شود")
  return context
}
