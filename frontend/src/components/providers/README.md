# components/providers

Provider های سراسری Client Component که از `src/app/layout.tsx` (Server Component) صدا زده می‌شوند. رجوع کامل به [docs/FRONTEND.md](../../../../docs/FRONTEND.md#۹-زبان-و-ظاهر-i18n-و-theme) بخش ۹.

- `locale-provider.tsx` → `LocaleProvider` (کوکی `locale` + state کلاینت) و هوک‌های `useLocale` (`{ locale, setLocale, t }`) / `useT` (فقط `t`). `setLocale` کوکی را می‌نویسد، state را فوری عوض می‌کند، و `router.refresh()` می‌زند تا Server Component ها (عنوان صفحه‌ها) هم با زبان جدید رندر شوند.
- حالت ظاهر برنامه فعلاً روی روشن قفل است و سوییچر یا `ThemeProvider` ندارد. `src/app/layout.tsx` همیشه `data-theme="light"` می‌گذارد تا تنظیم تیرهٔ سیستم یا کوکی قدیمی اثر نگذارد.
- `app-providers.tsx` → `AppProviders`: پوسته‌ی مشترک که `LocaleProvider` و `DirectionProvider` (Base UI، از `components/ui/direction.tsx`) را به‌کار می‌گیرد و جهت جاری (`localeDir(locale)`) را تنظیم می‌کند. مصرف‌کنندهٔ تنها: `src/app/layout.tsx`، با `initialLocale` خوانده‌شده از سمت سرور.

## قانون مهم

این پوشه فقط برای Context/Provider های **سراسری اپ** است (چیزی که در `layout.tsx` سوار می‌شود)، نه هر Context محلی یک فیچر. اگر یک فیچر به Context محلی خودش نیاز داشت، باید داخل پوشه‌ی همان فیچر (`src/features/<name>/`) بماند.
