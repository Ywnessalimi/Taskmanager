# features/tasks

هرچیزی که مربوط به خودِ موجودیت تسک است (نه نمایش آن داخل یک پروژه).

## چه‌کار می‌کند

- `task-create-form.tsx` → `TaskCreateForm` (Client): فرم صفحه‌ی **ساخت تسک جدید** (`/tasks/new`). چیدمانش از طرح Figma «AlignUI — Create Task modal» گرفته شده (پیل‌های Ghost قابل‌کلیک به‌جای سلکت‌های ساده) اما با آیکون‌های خودمان (RemixIcon)، نه آیکون‌های طرح؛ بخش‌هایی از طرح که به مدل داده‌ی فعلی ما تعلق ندارند (شناسه‌ی تسک، علاقه‌مندی/چک‌لیست، ساخته‌شده‌توسط + کامنت — چون پیش از ثبت هیچ‌کدام معنا ندارند) عمداً پیاده نشده‌اند.
  - عنوان (اجباری، اینپوت بزرگ بدون بوردر) + انتخابگر اولویت کنارش (`DropdownMenuRadioGroup` روی `PriorityDot`/`PRIORITY_LABEL`).
  - ردیف پیل‌های Ghost: پروژه (اجباری، `DropdownMenuRadioGroup`)، برچسب (کلیک→تبدیل به اینپوت این‌لاین)، تاریخ سررسید (کلیک→باز شدن `DatePickerDialog` مودال — رجوع به `components/ui/date-picker-dialog.tsx`)، مسئول (`DropdownMenuRadioGroup`، وابسته به پروژه‌ی انتخاب‌شده — با تغییر پروژه، اعضای سازمانِ همان پروژه بارگذاری و انتخاب قبلی پاک می‌شود).
  - توضیحات: `textarea` بدون بوردر (فقط یک خط جداکننده‌ی بالا) مطابق طرح.
  - ردیف «الصاق فایل»: مثل بقیه‌ی اپ (`project-overview.tsx`) فقط غیرفعال/دکوراتیو — پیوست واقعی هنوز پیاده نشده.
  - نوار پایین چسبان (`sticky bottom-0`، همان چیدمان نوار «ثبت» طرح Figma): دکمه‌ی «ساخت تسک» (تا عنوان خالی باشد غیرفعال) و «انصراف»؛ بعد از ثبت، `router.back()` کاربر را به صفحه‌ی قبلی برمی‌گرداند.
  - پیوست/کامنت/تایمر/زیر-تسک عمداً اینجا نیستند — طبق [docs/PRODUCT_OVERVIEW.md](../../../docs/PRODUCT_OVERVIEW.md) به صفحه‌ی جزئیات تسک تعلق دارند.

## وابستگی‌ها

- داده: `src/lib/api/tasks.ts` (`getTaskFormOptions` برای گزینه‌های پروژه/اعضا، `createTask` برای ثبت) و تایپ‌های `NewTaskInput` / `TaskFormProjectOption` / `TaskPriority` در `src/lib/api/types.ts`.
- برچسب و رنگ اولویت از `features/projects/task-display.tsx` (`PRIORITY_LABEL`, `PriorityDot`) می‌آید تا با نماهای تسک یکدست بماند.
- انتخابگرهای پروژه/مسئول/اولویت از `components/ui/dropdown-menu.tsx` (`DropdownMenuRadioGroup`/`DropdownMenuRadioItem`) ساخته شده‌اند — همان کامپوننتی که `PageHeader` برای منوی سه‌نقطه استفاده می‌کند.
- انتخابگر تاریخ سررسید از `components/ui/date-picker-dialog.tsx` (`DatePickerDialog`) است — یک مودال تقویم دست‌ساز (نه از shadcn) که بسته به زبان جاری تقویم جلالی (`src/lib/jalali.ts`) یا میلادی واقعی (`Date` بومی) نشان می‌دهد؛ جزئیات کامل در [components/ui/README.md](../../components/ui/README.md).
- مصرف‌کننده: `src/app/tasks/new/page.tsx` (Server Component، خارج از `(tabs)` — پس نوار تب پایین را ندارد و با `PageHeader` بسته می‌شود).
- ورودی این صفحه: `components/navigation/add-task-fab.tsx` (دکمه‌ی گرد شناور در تب‌های «خانه» و «تسک‌های من») و `components/navigation/sidebar-nav.tsx` (دکمه‌ی «تسک جدید» در نسخه‌ی دسکتاپ).

## نکات ناقص فعلی

- **تسک واقعاً ساخته نمی‌شود.** `createTask` فقط ورودی را در کنسول لاگ می‌کند؛ داده‌ی Mock در ماژول ثابت است و نوشتن در آن بین رفرش‌ها باقی نمی‌ماند و فقط توهم ذخیره‌سازی می‌ساخت. با آمدن بک‌اند به `POST /api/tasks/` وصل می‌شود.
- تاریخ سررسید از `DatePickerDialog` می‌آید (نه دیگر یک `input` متنی)؛ مقدار همچنان رشته‌ی `"YYYY/MM/DD"` با رقم لاتین است، فقط منبعش تقویم جلالی یا میلادی است بسته به زبان — رجوع به [components/ui/README.md](../../components/ui/README.md).
- `tags` و `description` به‌تازگی به تایپ `Task` اضافه شده‌اند و هنوز هیچ نمایی آن‌ها را نشان نمی‌دهد؛ فعلاً فقط در همین فرم ست می‌شوند.
