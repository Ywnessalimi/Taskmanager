# components/charts

ویجت‌های نموداری مشترکی که در چند صفحه‌ی Overview تکرار می‌شوند (طبق docs/PRODUCT_OVERVIEW.md، این سه ویجت هم در سازمان، هم در پروژه و هم بعداً در «تسک‌های من» ظاهر می‌شوند).

- `activity-heatmap.tsx` → `ActivityHeatmap`: گرید فعالیت روزانه (۷ ردیف × چند هفته) شبیه GitHub. مصرف‌کننده: `features/projects`، `features/users` (پروفایل کاربر).
- `status-donut-chart.tsx` → `StatusDonutChart`: چارت دایره‌ای SVG بدون کتابخانه‌ی خارجی. مصرف‌کننده: `features/projects` (بعداً `features/my-tasks`).

`ActivityHeatmap` از یک قرارداد رنگی پیروی می‌کند: سطح ۰ = طوسی خنثی (`bg-bg2`/`bg-bg3`، یعنی هیچ فعالیتی)، سطح‌های ۱ تا ۴ = شدت فزاینده‌ی رنگ `brand`.

هیچ‌کدام به داده‌ی خاص یک صفحه وابسته نیستند — فقط آرایه/عدد ساده می‌گیرند، پس هر فیچر جدیدی که این شکل داده را دارد می‌تواند مستقیماً از همین کامپوننت‌ها استفاده کند به‌جای ساختن نسخه‌ی جدید.

> `activity-bar-row.tsx` (`ActivityBarRow`) که قبلاً اینجا بود حذف شد — با بازطراحی صفحه‌ی سازمان مطابق طرح Figma «Home/OrganizationPage»، بخش «فعالیت اعضا» (که تنها مصرف‌کننده‌اش بود) از آن صفحه برداشته شد؛ رجوع به [features/organizations/README.md](../../features/organizations/README.md).
