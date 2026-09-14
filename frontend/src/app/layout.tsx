import { cookies } from "next/headers";
import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/app-providers";
import { localeDir } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";
import { parseTheme, THEME_COOKIE } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quire",
  description: "نرم‌افزار مدیریت تسک",
};

/**
 * زبان و ظاهر هر دو از کوکی (`locale`, `theme`) روی همین Server Component خوانده می‌شوند —
 * نه فقط state کلاینت — تا `<html lang dir data-theme>` از همان رندر اول سرور درست باشد
 * (بدون فلش زبان/تم اشتباه). رجوع به docs/FRONTEND.md بخش «زبان و ظاهر».
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, cookieStore] = await Promise.all([getLocale(), cookies()]);
  const theme = parseTheme(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <html
      lang={locale}
      dir={localeDir(locale)}
      data-theme={theme === "system" ? undefined : theme}
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <AppProviders initialLocale={locale} initialTheme={theme}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
