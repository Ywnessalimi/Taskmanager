# features/pages

صفحه‌های افزودنی سند و چت که از نوار تب پروژه و مسیر تجمیعی «تسک‌های من» باز می‌شوند.

## چه‌کار می‌کند

- `document-page.tsx` → `DocumentPage`: عنوان/متن قابل‌ویرایش و شمارندهٔ واژه؛ تغییرات از ProjectSectionTabs به API پروژه ذخیره می‌شوند و عنوان در خود تب منعکس می‌شود.
- `chat-page.tsx` → `ChatPage`: پیام‌های پایدار پروژه، تازه‌سازی دوره‌ای و ورودی ارسال که پایین پنل می‌ماند.

## وابستگی‌ها و مصرف‌کنندگان

- `ProjectSectionTabs` از `lib/api/project-pages.ts` برای ذخیرهٔ سند و چت SQLite استفاده می‌کند؛ نام فرستنده از کاربر جاری می‌آید. مسیر عمومی `/messages` بدون `projectId` همچنان محلی است.
- `ProjectSectionTabs` در `features/projects` این صفحه‌ها را در پروژه و `/home/projects/MyTasks` نشان می‌دهد؛ `src/app/(tabs)/messages/page.tsx` هم از `ChatPage` برای مسیر `/messages` استفاده می‌کند.
- برای هر پروژه فقط یک سند و یک چت ساخته می‌شود؛ API `project_pages` این محدودیت را هم در پایگاه داده اعمال می‌کند. پیام‌های تازه برای badge نارنجی نخوانده هر پنج ثانیه بررسی می‌شوند (بدون WebSocket).
