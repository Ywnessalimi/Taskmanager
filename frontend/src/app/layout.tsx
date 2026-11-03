import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/app-providers";
import { localeDir } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quire",
  description: "نرم‌افزار مدیریت تسک",
};

/**
 * زبان از کوکی (`locale`) خوانده می‌شود. ظاهر در این نسخه همیشه روشن است و `data-theme`
 * ثابت می‌ماند؛ تنظیم روشن/تیرهٔ سیستم یا کوکی قدیمی نمی‌تواند تم صفحه را تغییر دهد.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      dir={localeDir(locale)}
      data-theme="light"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <AppProviders initialLocale={locale}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
