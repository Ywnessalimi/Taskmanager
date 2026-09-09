# features/projects

پیاده‌سازی صفحه‌ی پروژه (بخش List و Overview، طبق docs/PRODUCT_OVERVIEW.md).

## چه‌کار می‌کند

- `project-task-list.tsx` → کامپوننت `ProjectTaskList` (Client): سوییچر ۵ نما (Tree/Board/Table/Timeline/Calendar). **فقط نمای Table واقعاً پیاده شده** (لیست ساده‌ی تسک‌ها با اولویت/وضعیت/مسئول)؛ بقیه فعلاً پیام «به‌زودی» نشان می‌دهند.
- `project-overview.tsx` → کامپوننت `ProjectOverview`: بازه‌ی زمانی + دکمه‌ی افزودن پیوست (غیرفعال فعلاً)، Project Health (۴ باکس آماری)، پراکندگی وضعیت تسک‌ها (`StatusDonutChart`)، تقویم سررسیدها (Placeholder ساده بدون تراز واقعی روز هفته)، فعالیت اعضا (`ActivityHeatmap`).

## وابستگی‌ها

- داده: `src/lib/api/projects.ts` (`getProject`) و تایپ‌های `Project`/`Task` در `src/lib/api/types.ts`.
- کامپوننت‌های مشترک: `src/components/charts/{activity-heatmap,status-donut-chart}.tsx`.
- مصرف‌کننده: `src/app/(tabs)/home/projects/[id]/page.tsx` — سوییچ List/Overview با `Tabs` شادکن.

## ارتباط با بقیه‌ی بخش‌ها

از صفحه‌ی سازمان ([../organizations](../organizations)) و از لیست پروژه‌های تودرتوی صفحه‌ی خانه ([../home](../home)) به این صفحه لینک داده می‌شود.

## قدم‌های بعدی (ناتمام عمداً)

- پیاده‌سازی واقعی نماهای Tree/Board (Drag & Drop)/Timeline/Calendar — هرکدام باید هنگام ساخت، فایل جدا و README خودش را داشته باشد.
- مدیریت ستون‌ها (Column Management) و افزودن عضو به Board — هنوز هیچ UI ندارد.
- توکن رنگ اختصاصی برای اولویت «بالا» در `colors.css` (فعلاً از `--error` به‌جای آن استفاده شده — رجوع به [../../../../docs/FRONTEND.md](../../../../docs/FRONTEND.md)).
