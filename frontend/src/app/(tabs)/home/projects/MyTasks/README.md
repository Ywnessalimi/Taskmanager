# مسیر `/home/projects/MyTasks`

این صفحه، تسک‌های تخصیص‌یافته به کاربر را از همهٔ پروژه‌ها در همان پوسته، ناوبری و نوار تب صفحهٔ پروژه نشان می‌دهد. مسیر ثابت `MyTasks` کنار مسیر پویای `[id]` قرار دارد؛ مسیر قدیمی `/my-tasks` حذف شده است.

## وابستگی‌ها و مصرف‌کنندگان

- داده: `lib/api/my-tasks.ts`، `lib/api/organizations.ts`، `lib/api/calendar.ts` و `lib/api/users.ts`.
- رابط: `features/projects/ProjectNavigator` و `ProjectSectionTabs`، به‌همراه `features/my-tasks/MyTasksOverview` و `MyTasksPageHeader`.
- دادهٔ Board: `features/tickets/ticket-data.ts`؛ تیکت‌ها فقط در Board و با وضعیت مشترک `TaskStatus` دیده می‌شوند. عنوان/وضعیت خواندنی است؛ آواتار سازنده و حداکثر یک ارجاع‌گیرنده در سمت راست کارت کمی روی هم می‌افتند و ارجاع از کارت قابل تغییر است. پیوند و ترتیب نمونه‌ای Ticket به Task در localStorage ثبت می‌شوند؛ هنگام درگ، تیکت‌های قبلی باقی می‌مانند و محل درج مشخص می‌شود. Ticket به Subtask تبدیل نمی‌شود.
- صفحه از شمارندهٔ تسک‌های خانه و پیوند «تسک‌های من» در `ProjectNavigator` باز می‌شود.
