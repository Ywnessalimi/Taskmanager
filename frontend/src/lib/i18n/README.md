# lib/i18n

دیکشنری متن‌های ثابت رابط کاربری (فارسی/انگلیسی) — رجوع کامل به [docs/FRONTEND.md](../../../../docs/FRONTEND.md#۹-زبان-و-ظاهر-i18n-و-theme) بخش ۹.۱.

## چه‌کار می‌کند

- `dictionary.ts` → `Locale` (`"fa" | "en"`)، `LOCALES`، `DEFAULT_LOCALE`، `LOCALE_COOKIE`، `localeDir(locale)`، دیکشنری `fa`/`en` (کلیدهای Namespace‌دار مثل `"nav.home"`)، و `t(locale, key)`. امن برای Server و Client هر دو (به `next/headers` وابسته نیست).
- `server.ts` → `getLocale()`: تابع `async` که کوکی `locale` را با `next/headers cookies()` می‌خواند. **فقط در Server Component** قابل‌استفاده است (ایمپورت آن در یک فایل `"use client"` بیلد را می‌شکند).

## وابستگی‌ها

- مصرف‌کننده‌ی سمت سرور: هر `page.tsx` که عنوان/برچسب ثابت دارد (`t(await getLocale(), "...")`).
- مصرف‌کننده‌ی سمت کلاینت: `src/components/providers/locale-provider.tsx` (`LocaleProvider`/`useLocale`/`useT`) — این فایل‌ها را wrap می‌کند تا کامپوننت‌های Client بدون تکرار `getLocale()` به `t()` دسترسی داشته باشند.

## قانون افزودن کلید جدید

اول اینجا (در آبجکت `fa`) کلید را اضافه کنید، بلافاصله همان کلید را در `en` هم با ترجمه‌ی واقعی پر کنید — تایپ `en: Record<keyof typeof fa, string>` اگر فراموش کنید کامپایل را می‌شکند (عمدی است، تا دو زبان هیچ‌وقت از هم عقب نیفتند). فقط متن‌های **ثابت رابط کاربری** اینجا می‌آیند؛ نام سازمان/پروژه/تسک و هر داده‌ی نوشته‌شده‌ی کاربر هرگز ترجمه نمی‌شود.
