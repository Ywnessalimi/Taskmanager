# features/tasks

هرچیزی که مربوط به خودِ موجودیت تسک است (نه نمایش آن داخل یک پروژه).

## چه‌کار می‌کند

- `task-create-form.tsx` → `TaskCreateForm` (Client): فرم **ساخت تسک جدید**. چیدمانش از طرح Figma «AlignUI — Create Task modal» گرفته شده (پیل‌های Ghost قابل‌کلیک به‌جای سلکت‌های ساده) اما با آیکون‌های خودمان (RemixIcon)، نه آیکون‌های طرح؛ بخش‌هایی از طرح که به مدل داده‌ی فعلی ما تعلق ندارند (شناسه‌ی تسک، علاقه‌مندی/چک‌لیست، ساخته‌شده‌توسط + کامنت — چون پیش از ثبت هیچ‌کدام معنا ندارند) عمداً پیاده نشده‌اند.
  - عنوان (اجباری، اینپوت بزرگ بدون بوردر) + انتخابگر اولویت کنارش (`DropdownMenuRadioGroup` روی `PriorityDot`/`PRIORITY_LABEL`).
  - ردیف پیل‌های Ghost: پروژه (اجباری، `DropdownMenuRadioGroup`)، برچسب (کلیک→تبدیل به اینپوت این‌لاین)، تاریخ سررسید (کلیک→باز شدن `DatePickerDialog` مودال — رجوع به `components/ui/date-picker-dialog.tsx`)، مسئول (`DropdownMenuRadioGroup`، وابسته به پروژه‌ی انتخاب‌شده — با تغییر پروژه، اعضای سازمانِ همان پروژه بارگذاری و انتخاب قبلی پاک می‌شود). **هر ردیف عضو در این منو اواتار (`components/ui/avatar.tsx`) + نام دارد** — اواتار اول در DOM می‌آید تا در RTL سمت راستِ نام بنشیند (طبق بازخورد کاربر). عکس‌ها از `TaskFormMemberOption.avatarUrl` می‌آیند (رجوع به «وابستگی‌ها»).
  - توضیحات: `textarea` بدون بوردر (فقط یک خط جداکننده‌ی بالا) مطابق طرح.
  - ردیف «الصاق فایل»: مثل بقیه‌ی اپ (`project-overview.tsx`) فقط غیرفعال/دکوراتیو — پیوست واقعی هنوز پیاده نشده.
  - نوار پایین («انصراف» سمت راست، «ساخت تسک» سمت چپ — چون در RTL اولین فرزند سمت راست می‌نشیند و «انصراف» اول در DOM آمده؛ «ساخت تسک» تا عنوان خالی باشد غیرفعال است): **همیشه** چسبیده به پایین صفحه/مودال است، نه فقط وقتی فرم بلند و اسکرول‌خور شود. این با `position: sticky` (روش قبلی) تضمین نمی‌شد — چون وقتی فرم کوتاه‌تر از ارتفاع صفحه بود، نوار درست بعد از آخرین فیلد می‌نشست و زیرش فضای خالی می‌ماند. راه‌حل الان یک چیدمان flex-column واقعی است: `<form>` خودش `flex-1 min-h-0 flex-col` است (فضای باقی‌مانده‌ی والدِ تمام‌ارتفاعش را پر می‌کند)، فیلدها داخل یک ناحیه‌ی مجزای `flex-1 overflow-y-auto` هستند، و نوار پایین یک فرزند معمولی و غیر-اسکرول‌شونده‌ی بعد از آن — پس همیشه دقیقاً به لبه‌ی پایین می‌چسبد. والدهایی که این چیدمان را ممکن می‌کنند: `app/tasks/new/page.tsx` (`h-dvh flex-col`) در موبایل، و `DialogContent variant="side"` (`h-full flex-col`) در دسکتاپ.
  - پیوست/کامنت/تایمر/زیر-تسک عمداً اینجا نیستند — طبق [docs/PRODUCT_OVERVIEW.md](../../../docs/PRODUCT_OVERVIEW.md) به صفحه‌ی جزئیات تسک تعلق دارند.
  - **دو حالت بستن دارد** (prop اختیاری `onDone`): وقتی به‌عنوان صفحه‌ی کامل موبایل استفاده می‌شود (`onDone` داده نشده)، بعد از ثبت/انصراف `router.back()` صدا زده می‌شود؛ وقتی داخل `NewTaskDialog` (پنل کناری دسکتاپ) رندر می‌شود، `onDone` را می‌گیرد که فقط `open` آن مودال را `false` می‌کند — چون آنجا هیچ ناوبری واقعی‌ای اتفاق نیفتاده که بخواهد «برگردد».
- `new-task-dialog.tsx` → `NewTaskDialog` (Client): تریگر «تسک جدید» در `DesktopHeader`. روی موبایل ساخت تسک همچنان یک **صفحه‌ی کامل** است (`/tasks/new`، از `AddTaskFab`)، اما دسکتاپ به‌جای ناوبری، همین `TaskCreateForm` را در یک **پنل کناری** باز می‌کند — نه مودال وسط‌چین معمولی: `DialogContent` با `variant="side"` (تعریف در `components/ui/dialog.tsx`) که تمام‌ارتفاع، تقریباً ۳۰٪ عرض صفحه (`w-[30%]`، با `min-w-80`/`max-w-md` برای صفحه‌های خیلی کوچک/بزرگ)، و چسبیده به سمت راست صفحه (`start-0`، چون اپ RTL است) است — نه وسط صفحه.

## وابستگی‌ها

- داده: `src/lib/api/tasks.ts` (`getTaskFormOptions` برای گزینه‌های پروژه/اعضا، `createTask` برای ثبت) و تایپ‌های `NewTaskInput` / `TaskFormProjectOption` / `TaskFormMemberOption` (شامل `avatarUrl` اختیاری) / `TaskPriority` در `src/lib/api/types.ts`.
- عکس پروفایل اعضا: `Member.avatarUrl` (در `src/lib/api/mock-data.ts`) به فایل‌های SVG دست‌ساز در `public/avatars/u1.svg`..`u6.svg` اشاره می‌کند — چون هیچ عکس واقعی کاربری در این اپ Mock وجود ندارد، این‌ها تصویرهای مینیمال و متنوع (رنگ پوست/مو/لباس متفاوت برای هر عضو) هستند تا لیست اعضا به‌جای فقط حرف اول اسم، طبیعی‌تر به‌نظر برسد. کاربر واردشده (`MOCK_CURRENT_USER`، همان `u1`) هم از همین فایل استفاده می‌کند.
- برچسب و رنگ اولویت از `features/projects/task-display.tsx` (`PRIORITY_LABEL`, `PriorityDot`) می‌آید تا با نماهای تسک یکدست بماند.
- انتخابگرهای پروژه/مسئول/اولویت از `components/ui/dropdown-menu.tsx` (`DropdownMenuRadioGroup`/`DropdownMenuRadioItem`) ساخته شده‌اند — همان کامپوننتی که `PageHeader` برای منوی سه‌نقطه استفاده می‌کند.
- انتخابگر تاریخ سررسید از `components/ui/date-picker-dialog.tsx` (`DatePickerDialog`) است — یک مودال تقویم دست‌ساز (نه از shadcn) که بسته به زبان جاری تقویم جلالی (`src/lib/jalali.ts`) یا میلادی واقعی (`Date` بومی) نشان می‌دهد؛ جزئیات کامل در [components/ui/README.md](../../components/ui/README.md).
- `NewTaskDialog` از `components/ui/dialog.tsx` (`Dialog`/`DialogContent variant="side"`) استفاده می‌کند — رجوع به [components/ui/README.md](../../components/ui/README.md) برای جزئیات این واریانت. `variant="side"` دیگر خودش پدینگ/اسکرول نمی‌گیرد (برخلاف قبل) — چون `TaskCreateForm` خودش مسئول اسکرول داخلی و نوار پایین ثابت است.
- مصرف‌کننده‌ها: `src/app/tasks/new/page.tsx` (Server Component، خارج از `(tabs)` — موبایل، `h-dvh flex-col` با `PageHeader`) و `src/components/navigation/desktop-header.tsx` (`NewTaskDialog`، دسکتاپ).
- ورودی «ساخت تسک»: `components/navigation/add-task-fab.tsx` (دکمه‌ی گرد شناور موبایل در تب‌های «خانه» و «تسک‌های من»، `lg:hidden`) و `components/navigation/desktop-header.tsx` (`NewTaskDialog`، فقط دسکتاپ).

## نکات ناقص فعلی

- **تسک واقعاً ساخته نمی‌شود.** `createTask` فقط ورودی را در کنسول لاگ می‌کند؛ داده‌ی Mock در ماژول ثابت است و نوشتن در آن بین رفرش‌ها باقی نمی‌ماند و فقط توهم ذخیره‌سازی می‌ساخت. با آمدن بک‌اند به `POST /api/tasks/` وصل می‌شود.
- تاریخ سررسید از `DatePickerDialog` می‌آید (نه دیگر یک `input` متنی)؛ مقدار همچنان رشته‌ی `"YYYY/MM/DD"` با رقم لاتین است، فقط منبعش تقویم جلالی یا میلادی است بسته به زبان — رجوع به [components/ui/README.md](../../components/ui/README.md).
- `tags` و `description` به‌تازگی به تایپ `Task` اضافه شده‌اند و هنوز هیچ نمایی آن‌ها را نشان نمی‌دهد؛ فعلاً فقط در همین فرم ست می‌شوند.
