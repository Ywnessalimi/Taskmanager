# features/projects

پیاده‌سازی صفحه‌ی پروژه (بخش List و Overview، طبق docs/PRODUCT_OVERVIEW.md).

## چه‌کار می‌کند

- `task-display.tsx` → ثابت‌ها و کامپوننت مشترک بین همه‌ی نماها: `PRIORITY_LABEL`، `PRIORITY_COLOR`، `STATUS_LABEL`، `STATUS_COLUMNS`، `PriorityDot`.
- `view-switcher.tsx` → `TASK_VIEWS` + `ViewSwitcher`: نوار سوییچ نما (آیکون + متن، تب فعال با پس‌زمینه‌ی خاکستری، بوردر کم‌رنگ زیر کل نوار). مشترک بین `ProjectTaskList` و `MyTaskList` (تب «تسک‌های من») — اگر نما یا آیکونی اضافه شد، فقط همین‌جا عوض می‌شود.
- `project-task-list.tsx` → کامپوننت `ProjectTaskList` (Client): سوییچر ۵ نما، هر ۵ تا واقعاً پیاده شده‌اند:
  - `views/table-view.tsx` → جدول واقعی (`<table>`) با ردیف هدر و بوردر بین همه‌ی سلول‌ها: اولویت، شناسه، عنوان، مسئول، سررسید، وضعیت. در عرض کم به‌صورت افقی اسکرول می‌شود.
  - `views/tree-view.tsx` → نمای درختی با باز/بسته کردن زیر-تسک‌ها (`task.subtasks`).
  - `views/board-view.tsx` → کانبان با Drag & Drop واقعی (کتابخانه‌ی `@dnd-kit`) بین سه ستون ثابت (در انتظار/در حال انجام/انجام‌شده)؛ جابه‌جایی فقط `status` تسک را در state محلی تغییر می‌دهد.
  - `views/timeline-view.tsx` → نمای گانت‌مانند: ساید‌بار جمع‌شونده‌ی تسک‌ها در سمت راست + تقویم افقی قابل اسکرول. بالای نما فیلتر مقیاس (روزانه/هفتگی/ماهانه) و دکمه‌ی «امروز» (اسکرول به ستون امروز) هست. هدر تاریخ دوردیفه است (نام ماه/سال روی ستون‌های هم‌گروه + برچسب هر ستون) و داخل همان کانتینر اسکرول قرار دارد تا هم‌زمان حرکت کند. بازه‌ی تقویم از سررسید تسک‌ها + «امروز» ساخته می‌شود، نه از بازه‌ی پروژه. ناحیه‌ی تقویم `dir="ltr"` است (قرارداد رایج نمودارهای زمانی، و `scrollLeft` استاندارد)، ساید‌بار در جریان RTL می‌ماند.
  - `views/calendar-view.tsx` → تقویم ماهانه با پیمایش بین ماه‌هایی که تسک دارند و لیست تسک‌های همان ماه زیرش؛ بدون تراز واقعی روز هفته.
- `project-overview.tsx` → کامپوننت `ProjectOverview`: بازه‌ی زمانی + دکمه‌ی افزودن پیوست (غیرفعال فعلاً)، «سلامت پروژه» (۴ باکس آماری)، پراکندگی وضعیت تسک‌ها (`StatusDonutChart`)، تقویم سررسیدها (Placeholder ساده)، فعالیت اعضا (`ActivityHeatmap`) — هر بخش داخل `SectionBox` (بوردر + پدینگ ۱۲px، طبق [../../components/layout](../../components/layout)).

## وابستگی‌ها

- داده: `src/lib/api/projects.ts` (`getProject`)، `src/lib/api/calendar.ts` (`getToday` — به‌صورت prop به `TimelineView` می‌رسد) و تایپ‌های `Project`/`Task` در `src/lib/api/types.ts` (`Task.subtasks` برای Tree).
- کامپوننت‌های مشترک: `src/components/charts/{activity-heatmap,status-donut-chart}.tsx`، `src/components/layout/{section,stat-tile}.tsx`، `src/lib/jalali.ts` (همه‌ی محاسبه‌های تاریخ Timeline/Calendar).
- کتابخانه‌ی خارجی: `@dnd-kit/core` + `@dnd-kit/utilities` فقط در `views/board-view.tsx` — تنها کتابخانه‌ی خارجی UI پروژه تا این لحظه؛ دلیل اضافه‌شدنش Drag & Drop لمسی/ماوس واقعی است که پیاده‌سازی دستی‌اش شکننده می‌شود.
- مصرف‌کننده: `src/app/(tabs)/home/projects/[id]/page.tsx` — سوییچ List/Overview با `SectionTabs` (رجوع به `../pages/README.md`)، که دکمه‌ی «+» و صفحه‌های سند/چت را هم می‌آورد.

## ارتباط با بقیه‌ی بخش‌ها

از صفحه‌ی سازمان ([../organizations](../organizations)) و از لیست پروژه‌های تودرتوی صفحه‌ی خانه ([../home](../home)) به این صفحه لینک داده می‌شود.

## قدم‌های بعدی (ناتمام عمداً)

- ستون‌های Board فعلاً ثابت‌اند (۳ وضعیت تسک)؛ مدیریت ستون سفارشی (Column Management) و افزودن عضو به Board هنوز UI ندارند.
- تغییرات Board/جابه‌جایی وضعیت فقط در state مرورگر است؛ با رفرش از بین می‌رود.
- توکن رنگ اختصاصی برای اولویت «بالا» در `colors.css` (فعلاً از `--error` به‌جای آن استفاده شده — رجوع به [../../../../docs/FRONTEND.md](../../../../docs/FRONTEND.md)).
- Timeline و Calendar حالا هر دو از `src/lib/jalali.ts` استفاده می‌کنند، اما آن ماژول هنوز تقویم جلالی واقعی نیست (بدون کبیسه، بدون روزِ هفته‌ی واقعی). Timeline تراز روز هفته ندارد و Calendar هم همچنان ستون روز هفته را واقعی نمی‌چیند.
- Timeline فقط `dueDate` را می‌شناسد (تسک تاریخ شروع ندارد)، پس هر تسک یک نشانه‌ی تک‌ستونی است نه میله‌ای کشیده بین دو تاریخ. اگر `startDate` به مدل تسک اضافه شد، همین‌جا باید به میله‌ی واقعی تبدیل شود.
