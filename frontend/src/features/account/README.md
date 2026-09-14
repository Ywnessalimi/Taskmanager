# features/account

پیاده‌سازی تب چهارم — «حساب کاربری» (رجوع به [docs/PRODUCT_OVERVIEW.md](../../../docs/PRODUCT_OVERVIEW.md) بخش «تب ۴ — حساب کاربری»).

## چه‌کار می‌کند

- `account-settings.tsx` → `AccountSettings` (Client): کل محتوای صفحه در چهار بخش:
  - **پروفایل**: اواتار (`AvatarImage` اگر `avatarUrl` باشد، وگرنه حرف اول نام)، نام، ایمیل (با `dir="ltr"`) و توضیح کوتاه + دکمه‌ی Ghost «ویرایش».
  - **حساب**: ردیف‌های تغییر ایمیل / تغییر رمز عبور (هنوز غیرفعال، بدون مقصد) + دو ردیف **واقعاً کاربردی** `LanguagePickerRow` و `AppearancePickerRow` (کامپوننت‌های محلی همین فایل): هرکدام یک `DropdownMenu` با `DropdownMenuRadioGroup` که به‌ترتیب زبان (`useLocale().setLocale`) و ظاهر (`useTheme().setTheme`) کل اپ را سراسری عوض می‌کنند — رجوع کامل به [docs/FRONTEND.md](../../../docs/FRONTEND.md#۹-زبان-و-ظاهر-i18n-و-theme).
  - **اعلان‌ها**: سه `Switch` روی `user.notifications` (تخصیص تسک، کامنت‌ها، خلاصه‌ی هفتگی).
  - **درباره**: راهنما، حریم خصوصی، نسخه.
  - **خروج**: دکمه‌ی Ghost قرمز که یک دیالوگ تایید باز می‌کند (خروج اکشن برگشت‌ناپذیر است).
- `profile-dialog.tsx` → `ProfileDialog`: مودال ویرایش نام/ایمیل/توضیحات. مقدارها با بستن مودال به حالت اولیه برمی‌گردند؛ «ذخیره» فقط `onSave` را صدا می‌زند و نگه‌داری state با `AccountSettings` است.
- `settings-row.tsx` → `SettingsGroup` / `SettingsLinkRow` / `SettingsToggleRow` (+ `ROW_BASE` export شده تا `LanguagePickerRow`/`AppearancePickerRow` همان ظاهر ردیف‌ها را با `DropdownMenuTrigger` تکرار کنند): ردیف‌های تکرارشونده‌ی تنظیمات (بوردر دور گروه، جداکننده‌ی ظریف بین ردیف‌ها، بدون سایه — مطابق [docs/DESIGN.md](../../../docs/DESIGN.md)).

تمام متن‌های این فایل‌ها به‌جای رشته‌ی فارسی مستقیم، از `useT()`/`useLocale()` (`src/components/providers/locale-provider.tsx`) می‌آیند — چون این صفحه محل واقعی سوییچ زبان است، باید خودش اول کاملاً چندزبانه باشد.

## وابستگی‌ها

- داده: `src/lib/api/users.ts` (`getCurrentUser`) و تایپ‌های `CurrentUser` / `NotificationPreferences` در `src/lib/api/types.ts`.
- UI: `components/ui/{avatar, button, dialog, dropdown-menu, switch, remix-icon}` و `components/layout/section.tsx` (`SectionTitle`).
- زبان/ظاهر: `components/providers/{locale-provider, theme-provider}.tsx` و `lib/{i18n/dictionary, theme}.ts`.
- مصرف‌کننده: `src/app/(tabs)/account/page.tsx` (Server Component که `getCurrentUser()` را صدا می‌زند و نتیجه را به `AccountSettings` پاس می‌دهد).

## ارتباط با بقیه‌ی بخش‌ها

تایپ `CurrentUser` مخصوص این فیچر نیست: Overview تب «تسک‌های من» هم به نام/عکس/ایمیل/توضیحات همین کاربر نیاز دارد و باید از همان `getCurrentUser()` استفاده کند، نه یک منبع داده‌ی موازی. کاربر Mock عمداً همان `u1` (سارا احمدی) از اعضای `org-1` در `mock-data.ts` است تا داده‌ی سازمان/پروژه با آن هم‌خوان بماند.

## نکات ناقص فعلی

- تغییر پروفایل و سوییچ‌های اعلان فقط در state مرورگر است و با رفرش صفحه بازنشانی می‌شود (هنوز API واقعی و `PATCH /api/me/` وجود ندارد) — **بر خلاف زبان و ظاهر که سراسری‌اند و با کوکی ماندگارند** (رفرش صفحه پاکشان نمی‌کند).
- ردیف‌های «تغییر ایمیل / تغییر رمز عبور / راهنما / حریم خصوصی» هنوز مقصد ندارند.
- دکمه‌ی «خروج» داخل دیالوگ فقط دیالوگ را می‌بندد؛ چون هنوز احراز هویتی (Auth) در پروژه وجود ندارد که بشود از آن خارج شد.
