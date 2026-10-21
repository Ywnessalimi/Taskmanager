# lib/api

این لایه قراردادهای داده و درخواست‌های فرانت‌اند به بک‌اند را نگه می‌دارد. `backend-client.ts` درخواست‌های هم‌مبدأ و کوکی نشست را به `/api/v1` می‌فرستد؛ مسیرهای API به `backend/server.js` و SQLite متصل‌اند.

وابستگی‌ها: `types.ts` برای قراردادها و `backend-client.ts` برای ارتباط HTTP. درخواست‌های مرورگر User-Agent را با header داخلی `x-quire-user-agent` می‌فرستند تا API بتواند دستگاه و مرورگر نشست را ثبت کند. توابع `auth.ts`، `organizations.ts`، `projects.ts`، `tasks.ts`، `tickets.ts`، `notifications.ts`، `project-pages.ts` و `assistant.ts` دامنه‌های ورود/نشست، ساختار پروژه، تسک، تیکت، اعلان، سند/گفت‌وگو و دستیار را می‌خوانند یا تغییر می‌دهند. نشست‌ها با `GET/DELETE /api/v1/auth/sessions` در همان قرارداد احراز هویت مدیریت می‌شوند.

مصرف‌کننده‌ها: صفحه‌های `app/` و فیچرهای `features/`. رکوردهای سازمان، پروژه، تسک و تیکت از API می‌آیند؛ `features/ai/` از `assistant.ts` برای گفت‌وگوی سروری استفاده می‌کند. fixtureهای `mock-data.ts` فقط برای اجزای نمایشی باقیمانده‌اند و منبع دادهٔ صفحات عملیاتی نیستند.
