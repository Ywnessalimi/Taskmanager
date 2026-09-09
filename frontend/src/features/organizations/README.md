# features/organizations

پیاده‌سازی صفحه‌ی Overview سازمان (وقتی از تب خانه روی یک سازمان کلیک می‌شود).

## چه‌کار می‌کند

- `organization-overview.tsx` → کامپوننت `OrganizationOverview`: سه بخش — لیست اعضا، پروژه‌های فعال (لینک به صفحه‌ی پروژه)، فعالیت اعضا (`ActivityHeatmap`).

## وابستگی‌ها

- داده: `src/lib/api/organizations.ts` (`getOrganization`) و تایپ `Organization` در `src/lib/api/types.ts`.
- کامپوننت مشترک: `src/components/charts/activity-heatmap.tsx`.
- مصرف‌کننده: `src/app/(tabs)/home/organizations/[id]/page.tsx` (که هدر عنوان سازمان + تعداد تسک را جدا رندر می‌کند).

## ارتباط با بقیه‌ی بخش‌ها

لیست پروژه‌های فعال به `/home/projects/[id]` لینک می‌شود ([../projects](../projects)). فهرست سازمان‌ها/پروژه‌ها در صفحه‌ی خانه از همین منبع داده (`getOrganizations`) می‌آید ([../home](../home)) — هر دو صفحه باید همیشه به یک شناسه‌ی سازمان/پروژه برسند.

## نکات ناقص فعلی

اعضا با `Avatar`/`AvatarFallback` شادکن نشان داده می‌شوند اما فقط حرف اول اسم دارند، نه عکس واقعی — وقتی فیلد عکس پروفایل به مدل `Member` اضافه شد، کافی‌ست `AvatarImage` با `src` واقعی اضافه شود.
