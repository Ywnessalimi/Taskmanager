# components/charts

ویجت‌های نموداری مشترکی که در چند صفحه‌ی Overview تکرار می‌شوند (طبق docs/PRODUCT_OVERVIEW.md، این سه ویجت هم در سازمان، هم در پروژه و هم بعداً در «تسک‌های من» ظاهر می‌شوند).

- `activity-heatmap.tsx` → `ActivityHeatmap`: گرید فعالیت روزانه (۷ ردیف × چند هفته) شبیه GitHub. مصرف‌کننده: `features/projects`، `features/users` (پروفایل کاربر).
- `status-donut-chart.tsx` → `StatusDonutChart`: چارت دایره‌ای چندبخشی SVG بدون کتابخانه‌ی خارجی (با legend). پیش‌فرض‌ها همان دونات با legend کنارش (`features/my-tasks`)؛ `variant="pie"` + `legendPosition="bottom"` (+ `size`/`showValues`/`opacity` هر بخش) برای کارت «پراکندگی وضعیت تسک‌ها»ی `features/projects/project-overview.tsx` اضافه شده — رجوع به [../../features/projects/README.md](../../features/projects/README.md).
- `member-activity-grid.tsx` → `MemberActivityGrid`: برخلاف `ActivityHeatmap` (ستون‌به‌ستون هفتگی، تک‌کاربره)، اینجا هر عضو یک *ردیف* افقی از سلول‌های روزانه است زیر یک محور تاریخ مشترک — برای کارت «فعالیت اعضا»ی نمای‌کلی پروژه (`MemberActivitySection`). مثل `LineTrendChart` همیشه `dir="ltr"` است (محور زمان، نه متن). از همان طیف رنگی `LEVEL_CLASSES` (export شده از `activity-heatmap.tsx`) استفاده می‌کند.
- `segmented-progress-bar.tsx` → `SegmentedProgressBar`: نوار پیشرفت افقی که از چند مستطیل عمودی باریک ساخته شده؛ قطعه‌های پرشده رنگ `brand` و قطعه‌های خالی `bg3` می‌گیرند تا کل طول نوار دیده شود. مصرف‌کننده: `features/organizations` (ردیف‌های «خلاصه‌ای از پروژه‌ها»).
- `progress-ring.tsx` → `ProgressRing`: حلقه‌ی پیشرفت کوچک **تک‌مقداری** (همان تکنیک SVG stroke-dasharray، بدون legend) — برای وقتی فقط یک درصد ساده باید کنار متن نشان داده شود، نه چند بخش. مصرف‌کننده: `features/home/WorkspaceList` (درصد پیشرفت هر پروژه).
- `line-trend-chart.tsx` → `LineTrendChart`: نمودار خطی چندسری SVG بدون کتابخانه‌ی خارجی — چند آرایه‌ی عدد هم‌طول (`TrendSeries[]`) + برچسب محور x می‌گیرد و خودش محور y را با ۵ پله‌ی «گرد» می‌سازد. مثل نمای Timeline (`features/projects/views/timeline-view.tsx`)، ریشه‌اش `dir="ltr"` است — قرارداد رایج نمودارهای زمانی، صرف‌نظر از جهت بقیه‌ی صفحه. مصرف‌کننده: `features/projects/project-health.tsx` (`ProjectHealthSection`).

`ActivityHeatmap` از یک قرارداد رنگی پیروی می‌کند: سطح ۰ = طوسی خنثی (`bg-bg2`/`bg-bg3`، یعنی هیچ فعالیتی)، سطح‌های ۱ تا ۴ = شدت فزاینده‌ی رنگ `brand`. این طیف به‌صورت `LEVEL_CLASSES` export شده تا `MemberActivityGrid` و `DeadlineCalendar` (`features/projects`) هم همان قرارداد را برای «تراکم» (نه فقط «فعالیت») استفاده کنند.

هیچ‌کدام به داده‌ی خاص یک صفحه وابسته نیستند — فقط آرایه/عدد ساده می‌گیرند، پس هر فیچر جدیدی که این شکل داده را دارد می‌تواند مستقیماً از همین کامپوننت‌ها استفاده کند به‌جای ساختن نسخه‌ی جدید.

> `activity-bar-row.tsx` (`ActivityBarRow`) که قبلاً اینجا بود حذف شد — با بازطراحی صفحه‌ی سازمان مطابق طرح Figma «Home/OrganizationPage»، بخش «فعالیت اعضا» (که تنها مصرف‌کننده‌اش بود) از آن صفحه برداشته شد؛ رجوع به [features/organizations/README.md](../../features/organizations/README.md).
