# features/account

پیاده‌سازی تب چهارم — «حساب کاربری» (رجوع به [docs/PRODUCT_OVERVIEW.md](../../../docs/PRODUCT_OVERVIEW.md) بخش «تب ۴ — حساب کاربری»).

## چه‌کار می‌کند

- `account-settings.tsx` → `AccountSettings` (Client): کل محتوای صفحه در چهار بخش:
  - **پروفایل**: آواتار واقعی حساب (`avatarUrl` یا حرف اول نام)، نام، ایمیل (با `dir="ltr"`) و توضیح کوتاه + دکمه‌ی Ghost «ویرایش».
  - **حساب**: ردیف‌های تغییر ایمیل / تغییر رمز عبور (هنوز غیرفعال، بدون مقصد) + دو ردیف **واقعاً کاربردی** `LanguagePickerRow` و `AppearancePickerRow` (کامپوننت‌های محلی همین فایل): هرکدام یک `DropdownMenu` با `DropdownMenuRadioGroup` که به‌ترتیب زبان (`useLocale().setLocale`) و ظاهر (`useTheme().setTheme`) کل اپ را سراسری عوض می‌کنند — رجوع کامل به [docs/FRONTEND.md](../../../docs/FRONTEND.md#۹-زبان-و-ظاهر-i18n-و-theme).
  - **نشست‌ها**: ردیف قابل کلیک در بخش حساب به `/account/sessions` می‌رود. صفحهٔ مستقل با `sessions-list.tsx` نشست‌های واقعی حساب را از API می‌خواند؛ آیکون نوع دستگاه، نام مرورگر، نشان «این دستگاه»، آخرین فعالیت و دکمهٔ لغو هر نشست را نمایش می‌دهد. لغو نشست جاری کاربر را به صفحهٔ ورود می‌فرستد.
  - **اعلان‌ها**: سه `Switch` روی `user.notifications` (تخصیص تسک، کامنت‌ها، خلاصه‌ی هفتگی).
  - **درباره**: راهنما، حریم خصوصی، نسخه.
  - **خروج**: دکمه‌ی Ghost قرمز که یک دیالوگ تایید باز می‌کند (خروج اکشن برگشت‌ناپذیر است).
- `profile-dialog.tsx` → `ProfileDialog`: مودال ویرایش نام/ایمیل/توضیحات و انتخاب عکس. عکس پیش از ارسال به ۵۱۲ پیکسل و JPEG فشرده می‌شود؛ `PATCH /api/v1/auth/me` پروفایل را در SQLite ذخیره می‌کند. ذخیرهٔ موفق state مشترک کاربر را به‌روز می‌کند تا آواتار در هدرها و مینی‌بارها نیز تغییر کند.
- `settings-row.tsx` → `SettingsGroup` / `SettingsLinkRow` / `SettingsToggleRow` (+ `ROW_BASE` export شده تا `LanguagePickerRow`/`AppearancePickerRow` همان ظاهر ردیف‌ها را با `DropdownMenuTrigger` تکرار کنند): ردیف‌های تکرارشونده‌ی تنظیمات (بوردر دور گروه، جداکننده‌ی ظریف بین ردیف‌ها، بدون سایه — مطابق [docs/DESIGN.md](../../../docs/DESIGN.md)).

تمام متن‌های این فایل‌ها به‌جای رشته‌ی فارسی مستقیم، از `useT()`/`useLocale()` (`src/components/providers/locale-provider.tsx`) می‌آیند — چون این صفحه محل واقعی سوییچ زبان است، باید خودش اول کاملاً چندزبانه باشد.

## وابستگی‌ها

- داده: `src/lib/api/users.ts` (`getCurrentUser`)، `src/lib/api/auth.ts` (فهرست/لغو نشست‌ها) و تایپ‌های `CurrentUser` / `AuthSession` / `NotificationPreferences` در `src/lib/api/types.ts`.
- UI: `components/ui/{avatar, button, dialog, dropdown-menu, switch, remix-icon}` و `components/layout/section.tsx` (`SectionTitle`).
- زبان/ظاهر: `components/providers/{locale-provider, theme-provider}.tsx` و `lib/{i18n/dictionary, theme}.ts`.
- مصرف‌کننده: `src/app/(tabs)/account/page.tsx` (Server Component که `getCurrentUser()` را صدا می‌زند و نتیجه را به `AccountSettings` پاس می‌دهد) و `src/app/(tabs)/account/sessions/page.tsx` (صفحهٔ مستقل نشست‌ها).

## ارتباط با بقیه‌ی بخش‌ها

تایپ `CurrentUser` مخصوص این فیچر نیست: Overview تب «تسک‌های من» هم به نام/عکس/ایمیل/توضیحات همین کاربر نیاز دارد و باید از همان `getCurrentUser()` استفاده کند، نه یک منبع داده‌ی موازی. کاربر Mock عمداً همان `u1` (سارا احمدی) از اعضای `org-1` در `mock-data.ts` است تا داده‌ی سازمان/پروژه با آن هم‌خوان بماند.

## نکات ناقص فعلی

- سوییچ‌های اعلان هنوز در state مرورگر هستند و با رفرش صفحه بازنشانی می‌شوند؛ زبان و ظاهر سراسری‌اند و با کوکی ماندگارند.
- فهرست نشست‌ها از `GET /api/v1/auth/sessions` می‌آید و حذف هر ردیف با `DELETE /api/v1/auth/sessions/:sessionId` انجام می‌شود؛ نشست جاری با درخواست‌های احراز‌شده آخرین فعالیتش را تازه می‌کند.
- ردیف‌های «تغییر ایمیل / تغییر رمز عبور / راهنما / حریم خصوصی» هنوز مقصد ندارند.
- دکمهٔ «خروج» نشست احراز هویت را در API باطل می‌کند.
