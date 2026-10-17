# features/my-tasks

پیاده‌سازی بخش «تسک‌های من» در محیط پروژه‌ها (رجوع به [docs/PRODUCT_OVERVIEW.md](../../../docs/PRODUCT_OVERVIEW.md) بخش «تسک‌های من»).

## چه‌کار می‌کند

- `my-tasks-overview.tsx` → `MyTasksOverview` (Server): پروفایل کاربر، «نیازمند رسیدگی»، پراکندگی وضعیت، سلامت تجمیعی پروژه‌ها و فعالیت شخصی؛ در تب Dashboard مسیر `/home/projects/MyTasks` نمایش داده می‌شود.
- `my-tasks-page-header.tsx` → هدر مسیر تجمیعی با ظاهر `PageHeader` پروژه و اکشن ساخت تسک.

## وابستگی‌ها

- داده: `src/lib/api/my-tasks.ts` (`getMyTasks`, `getMyTasksOverview`)، `src/lib/api/users.ts` (`getCurrentUser`)؛ تایپ‌های `MyTask` و `MyTasksOverview` در `src/lib/api/types.ts`.
- رابط: `features/projects/ProjectNavigator`, `ProjectSectionTabs` و `ProjectTaskList`; نمودارهای `StatusDonutChart` و `ActivityHeatmap`.
- مصرف‌کننده: `src/app/(tabs)/home/projects/MyTasks/page.tsx` و پیوندهای خانه و ProjectNavigator.

## قواعد داده‌ای

- فهرست نماها تسک‌های «در حال انجام» را از همهٔ پروژه‌ها نشان می‌دهد؛ Overview همهٔ وضعیت‌های تسک‌های کاربر را برای نمودارها و سلامت تجمیعی در نظر می‌گیرد.
- فقط نمای Board، همهٔ تیکت‌های نمونه و محلی را نیز از ماژول tickets می‌گیرد؛ عنوان و وضعیت تیکت‌ها خواندنی‌اند و با همان `TaskStatus` در ستون وضعیت خود قرار می‌گیرند. آواتار سازنده و در صورت وجود آواتار یک ارجاع‌گیرنده در سمت راست کمی روی هم می‌افتند؛ ارجاع را می‌توان از کارت تغییر داد یا پاک کرد. هنگام کشیدن تیکت روی کارت تسک، تیکت‌های متصل باقی می‌مانند و جایگاه خاکستری محل درج را نشان می‌دهد؛ پیوند و ترتیب نمونه‌ای در localStorage می‌ماند و تیکت همچنان از Subtask متمایز است.
- تخصیص تسک فعلاً با مقایسه‌ی نام انجام می‌شود، چون مدل Mock هنوز `assigneeId` ندارد.
- «عقب‌افتاده» با `MOCK_TODAY` در `mock-data.ts` سنجیده می‌شود؛ تاریخ‌ها جلالی و دستی‌اند.

## ارتباط با بقیه‌ی بخش‌ها

نماهای Board، Tree، Calendar و Timeline از `features/projects/views/` می‌آیند و کپی نشده‌اند؛ چیدمان و نوار تب با صفحهٔ پروژه یکی است. Board برای تیکت‌ها prop اختیاری می‌گیرد؛ صفحه‌های پروژه این prop را نمی‌فرستند و تیکت نشان نمی‌دهند. مسیر قدیمی `/my-tasks` دیگر وجود ندارد.
