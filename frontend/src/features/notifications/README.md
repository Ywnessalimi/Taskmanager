# features/notifications

پیاده‌سازی صفحه‌ی «اعلان‌ها» (تب سوم).

## چه‌کار می‌کند

- `notification-list.tsx` → کامپوننت `NotificationList` (Client):
  - فیلتر بالای صفحه با `Tabs` شادکن (کنترل‌شده): همه / خوانده‌نشده / خوانده‌شده / تایید.
  - هر ردیف: آیکون بر اساس نوع مقصد (تسک/پروژه/سازمان)، متن رخداد، زمان نسبی، نقطه‌ی آبی برای خوانده‌نشده‌ها.
  - **متن رخداد (`verb`) و زمان نسبی (`createdAt`) چندزبانه‌اند** — `Notification.verb` یک کلید ثابت است (مثل `"taskAssigned"`)، نه رشته‌ی آماده، و از طریق `VERB_KEY`/`useT()` به متن زبان جاری ترجمه می‌شود؛ `createdAt` هم یک مقدار ساختاریافته (`{unit, amount}`) است که با `formatRelativeTime()` در همین فایل فرمت می‌شود. فقط `actorName` و `target.label` (چون داده‌ی واقعی/نام موجودیت‌اند نه متن سیستم) هرگز ترجمه نمی‌شوند.
  - **نام عامل رخداد (`actorName`) اگر `actorId` داشته باشد یک لینک است** به `/users/{actorId}` (صفحه‌ی پروفایل عمومی کاربر — رجوع به [features/users/README.md](../users/README.md)) با `stopPropagation` تا کلیک روی نام، کلیک روی کل ردیف (هدایت به مقصد) را trigger نکند.
  - کلیک روی بقیه‌ی ردیف = علامت‌گذاری خوانده‌شده + هدایت به مقصد (`router.push`).
  - اعلان‌های `requiresApproval: true` دو دکمه‌ی «تایید»/«رد» دارند که فقط وضعیت را محلی تغییر می‌دهند؛ همان `requiresApproval` حالا به‌جای اینکه در متن `verb` هاردکد شود («... — نیاز به تایید شما»)، به‌صورت پسوند جدا و ترجمه‌شده (`notifications.needsApproval`) اضافه می‌شود.

## وابستگی‌ها

- داده: `src/lib/api/notifications.ts` (`getNotifications`) و تایپ‌های `Notification`/`NotificationTarget`/`NotificationVerb`/`RelativeTime` در `src/lib/api/types.ts`.
- زبان: `components/providers/locale-provider.tsx` (`useT`) — کلیدهای `notifications.verb.*`/`notifications.needsApproval`/`time.*` در `lib/i18n/dictionary.ts`.
- مصرف‌کننده: `src/app/(tabs)/notifications/page.tsx`.

## ارتباط با بقیه‌ی بخش‌ها

مقصد اعلان‌های نوع `project`/`organization` مستقیم به `/home/projects/[id]` یا `/home/organizations/[id]` می‌رود. مقصد نوع `task` چون هنوز صفحه‌ی جزئیات تسک وجود ندارد، موقتاً به همان صفحه‌ی پروژه‌ی تسک هدایت می‌شود — وقتی آن صفحه ساخته شد، `targetHref` در همین فایل باید به‌روزرسانی شود.

## نکات ناقص فعلی

- خواندن/تایید فقط در state مرورگر است و با رفرش صفحه بازنشانی می‌شود (API واقعی هنوز وجود ندارد).
- اگر verb جدیدی لازم شد، اول باید کلیدش به `NotificationVerb` (در `types.ts`) و بعد ترجمه‌اش به `dictionary.ts` (هر دو زبان) اضافه شود، بعد در `VERB_KEY` همین فایل نگاشت داده شود — TypeScript اگر یکی از این‌ها را فراموش کنید خطا می‌دهد (نگاشت‌ها `Record<NotificationVerb, TranslationKey>` تایپ شده‌اند).
