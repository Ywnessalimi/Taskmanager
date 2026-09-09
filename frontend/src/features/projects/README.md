# features/projects

پیاده‌سازی صفحه‌ی پروژه (بخش List و Overview، طبق docs/PRODUCT_OVERVIEW.md).

## چه‌کار می‌کند

- `task-display.tsx` → ثابت‌ها و کامپوننت مشترک بین همه‌ی نماها: `PRIORITY_LABEL`، `PRIORITY_COLOR`، `STATUS_LABEL`، `STATUS_COLUMNS`، `PriorityDot`.
- `project-task-list.tsx` → کامپوننت `ProjectTaskList` (Client): سوییچر ۵ نما، هر ۵ تا واقعاً پیاده شده‌اند:
  - `views/table-view.tsx` → لیست ساده‌ی تسک‌ها (اولویت، شناسه، عنوان، مسئول، وضعیت).
  - `views/tree-view.tsx` → نمای درختی با باز/بسته کردن زیر-تسک‌ها (`task.subtasks`).
  - `views/board-view.tsx` → کانبان با Drag & Drop واقعی (کتابخانه‌ی `@dnd-kit`) بین سه ستون ثابت (در انتظار/در حال انجام/انجام‌شده)؛ جابه‌جایی فقط `status` تسک را در state محلی تغییر می‌دهد.
  - `views/timeline-view.tsx` → هر تسک یک ردیف با یک نقطه روی محور زمان (بر اساس `dueDate` نسبت به بازه‌ی `startDate`–`endDate` پروژه)؛ محور همیشه LTR (قرارداد رایج نمودارهای زمانی حتی در اپ RTL).
  - `views/calendar-view.tsx` → تقویم ماهانه با پیمایش بین ماه‌هایی که تسک دارند و لیست تسک‌های همان ماه زیرش؛ بدون تراز واقعی روز هفته.
- `project-overview.tsx` → کامپوننت `ProjectOverview`: بازه‌ی زمانی + دکمه‌ی افزودن پیوست (غیرفعال فعلاً)، «سلامت پروژه» (۴ باکس آماری)، پراکندگی وضعیت تسک‌ها (`StatusDonutChart`)، تقویم سررسیدها (Placeholder ساده)، فعالیت اعضا (`ActivityHeatmap`) — هر بخش داخل `SectionBox` (بوردر + پدینگ ۱۲px، طبق [../../components/layout](../../components/layout)).

## وابستگی‌ها

- داده: `src/lib/api/projects.ts` (`getProject`) و تایپ‌های `Project`/`Task` در `src/lib/api/types.ts` (`Task.subtasks` برای Tree).
- کامپوننت‌های مشترک: `src/components/charts/{activity-heatmap,status-donut-chart}.tsx`، `src/components/layout/section.tsx`.
- کتابخانه‌ی خارجی: `@dnd-kit/core` + `@dnd-kit/utilities` فقط در `views/board-view.tsx` — تنها کتابخانه‌ی خارجی UI پروژه تا این لحظه؛ دلیل اضافه‌شدنش Drag & Drop لمسی/ماوس واقعی است که پیاده‌سازی دستی‌اش شکننده می‌شود.
- مصرف‌کننده: `src/app/(tabs)/home/projects/[id]/page.tsx` — سوییچ List/Overview با `Tabs` شادکن.

## ارتباط با بقیه‌ی بخش‌ها

از صفحه‌ی سازمان ([../organizations](../organizations)) و از لیست پروژه‌های تودرتوی صفحه‌ی خانه ([../home](../home)) به این صفحه لینک داده می‌شود.

## قدم‌های بعدی (ناتمام عمداً)

- ستون‌های Board فعلاً ثابت‌اند (۳ وضعیت تسک)؛ مدیریت ستون سفارشی (Column Management) و افزودن عضو به Board هنوز UI ندارند.
- تغییرات Board/جابه‌جایی وضعیت فقط در state مرورگر است؛ با رفرش از بین می‌رود.
- توکن رنگ اختصاصی برای اولویت «بالا» در `colors.css` (فعلاً از `--error` به‌جای آن استفاده شده — رجوع به [../../../../docs/FRONTEND.md](../../../../docs/FRONTEND.md)).
- Timeline و Calendar از یک تبدیل تاریخ ساده‌ی خودشان استفاده می‌کنند (نه تقویم جلالی واقعی) — اگر بعداً یک ماژول تبدیل تاریخ مشترک ساخته شد، این دو باید به آن مهاجرت کنند.
