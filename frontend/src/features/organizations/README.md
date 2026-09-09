# features/organizations

پیاده‌سازی صفحه‌ی Overview سازمان (وقتی از تب خانه روی یک سازمان کلیک می‌شود).

## چه‌کار می‌کند

- `organization-overview.tsx` → کامپوننت `OrganizationOverview`: سه بخش —
  1. **اعضا**: فقط اواتارهای دایره‌ای روی‌هم‌افتاده (تریگر `MembersDialog`)، بدون لیست کامل در صفحه‌ی اصلی.
  2. **پروژه‌های فعال**: داخل یک باکس با بوردر و پدینگ ۱۲px (`SectionBox`)، لینک به صفحه‌ی هر پروژه.
  3. **فعالیت اعضا**: همان باکس بوردردار؛ هر عضو یک ردیف است (اواتار + نام کوتاه‌شده با `truncate` + `ActivityBarRow`).
- `members-dialog.tsx` → کامپوننت `MembersDialog`: دیالوگ مدیریت اعضا —
  - تاگل «فقط ادمین‌ها می‌توانند عضو جدید اضافه کنند» (state محلی، بدون پرسیستنس).
  - افزودن عضو جدید با تایپ نام (محلی/غیرماندگار).
  - هر ردیف عضو: اواتار، نام، نقش (ادمین/عضو عادی)، و منوی سه‌نقطه (سمت چپ ردیف چون RTL) برای تغییر نقش یا حذف — هر دو فقط روی state محلی همین کامپوننت اثر می‌گذارند.

## وابستگی‌ها

- داده: `src/lib/api/organizations.ts` (`getOrganization`) و تایپ‌های `Organization`/`Member` در `src/lib/api/types.ts` (`Member` شامل `role` و `activity` است).
- کامپوننت‌های مشترک: `src/components/charts/activity-bar-row.tsx`، `src/components/ui/{avatar,dialog,dropdown-menu,switch,button}.tsx`.
- هدر صفحه از `src/components/navigation/page-header.tsx` می‌آید، نه اینجا.
- مصرف‌کننده: `src/app/(tabs)/home/organizations/[id]/page.tsx`.

## ارتباط با بقیه‌ی بخش‌ها

لیست پروژه‌های فعال به `/home/projects/[id]` لینک می‌شود ([../projects](../projects)). فهرست سازمان‌ها/پروژه‌ها در صفحه‌ی خانه از همین منبع داده (`getOrganizations`) می‌آید ([../home](../home)) — هر سه صفحه باید همیشه به یک شناسه‌ی سازمان/پروژه برسند.

## نکات ناقص فعلی

- تغییر نقش/حذف عضو و تاگل «فقط ادمین‌ها» فقط در state مرورگر است؛ با رفرش از بین می‌رود (هنوز API واقعی عضویت وجود ندارد).
- اعضا با `AvatarFallback` (حرف اول اسم) نشان داده می‌شوند، نه عکس واقعی.
