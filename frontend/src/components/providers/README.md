# components/providers

Provider های سراسری Client Component که از `src/app/layout.tsx` (Server Component) صدا زده می‌شوند. رجوع کامل به [docs/FRONTEND.md](../../../../docs/FRONTEND.md#۹-زبان-و-ظاهر-i18n-و-theme) بخش ۹.

- `locale-provider.tsx` → `LocaleProvider` (کوکی `locale` + state کلاینت) و هوک‌های `useLocale` (`{ locale, setLocale, t }`) / `useT` (فقط `t`). `setLocale` کوکی را می‌نویسد، state را فوری عوض می‌کند، و `router.refresh()` می‌زند تا Server Component ها (عنوان صفحه‌ها) هم با زبان جدید رندر شوند.
- `theme-provider.tsx` → `ThemeProvider` (کوکی `theme` + state کلاینت) و هوک `useTheme` (`{ theme, setTheme }`). برخلاف زبان، `setTheme` نیازی به `router.refresh()` ندارد — مستقیم `document.documentElement.dataset.theme` را عوض می‌کند (تغییر ظاهر فقط CSS است، به هیچ محتوای سمت سرور وابسته نیست).
- `app-providers.tsx` → `AppProviders`: پوسته‌ی مشترک که `LocaleProvider` و `ThemeProvider` را تو در تو می‌گذارد و `DirectionProvider` (Base UI، از `components/ui/direction.tsx`) را بر اساس جهت زبان جاری (`localeDir(locale)`) تنظیم می‌کند. مصرف‌کننده‌ی تنها: `src/app/layout.tsx`، با `initialLocale`/`initialTheme` که از کوکی‌های خوانده‌شده‌ی سمت سرور می‌آیند (بدون فلش زبان/تم اشتباه در اولین رندر).

## قانون مهم

این پوشه فقط برای Context/Provider های **سراسری اپ** است (چیزی که در `layout.tsx` سوار می‌شود)، نه هر Context محلی یک فیچر. اگر یک فیچر به Context محلی خودش نیاز داشت، باید داخل پوشه‌ی همان فیچر (`src/features/<name>/`) بماند.
