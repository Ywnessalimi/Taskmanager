# components/charts

ویجت‌های نموداری مشترکی که در چند صفحه‌ی Overview تکرار می‌شوند (طبق docs/PRODUCT_OVERVIEW.md، این سه ویجت هم در سازمان، هم در پروژه و هم بعداً در «تسک‌های من» ظاهر می‌شوند).

- `activity-heatmap.tsx` → `ActivityHeatmap`: گرید فعالیت روزانه شبیه GitHub. مصرف‌کننده‌ها: `features/organizations`, `features/projects` (بعداً `features/my-tasks`).
- `status-donut-chart.tsx` → `StatusDonutChart`: چارت دایره‌ای SVG بدون کتابخانه‌ی خارجی. مصرف‌کننده: `features/projects` (بعداً `features/my-tasks`).

هیچ‌کدام به داده‌ی خاص یک صفحه وابسته نیستند — فقط آرایه/عدد ساده می‌گیرند، پس هر فیچر جدیدی که این شکل داده را دارد می‌تواند مستقیماً از همین دو کامپوننت استفاده کند به‌جای ساختن نسخه‌ی جدید.
