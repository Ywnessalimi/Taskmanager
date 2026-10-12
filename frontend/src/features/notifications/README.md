# features/notifications

پیاده‌سازی صفحه‌ی «اعلان‌ها» (تب سوم) و پیش‌نمایش آن در هدر دسکتاپ.

## چه‌کار می‌کند

- `notification-format.ts` — کمک‌تابع/نگاشت‌های **مشترک** بین `NotificationList` (صفحه‌ی کامل) و `NotificationsPreviewDialog` (پیش‌نمایش هدر دسکتاپ): `TARGET_ICON` (آیکون بر اساس نوع مقصد)، `VERB_KEY`/`STATUS_KEY` (نگاشت `Notification.verb`/`verbStatus` به کلید ترجمه)، `formatRelativeTime()` (فرمت `createdAt` ساختاریافته)، `targetHref()` (مقصد کلیک هر اعلان). چون همین منطق در دو جای مختلف لازم بود، از تکرار به یک ماژول مشترک منتقل شد.
- `notification-list.tsx` → کامپوننت `NotificationList` (Client):
  - فیلتر بالای صفحه با `Tabs` شادکن (کنترل‌شده): همه / خوانده‌نشده / خوانده‌شده / تایید.
  - هر ردیف: آیکون بر اساس نوع مقصد (تسک/پروژه/سازمان)، متن رخداد، زمان نسبی، نقطه‌ی آبی برای خوانده‌نشده‌ها.
  - **متن رخداد (`verb`) و زمان نسبی (`createdAt`) چندزبانه‌اند** — `Notification.verb` یک کلید ثابت است (مثل `"taskAssigned"`)، نه رشته‌ی آماده، و از طریق `VERB_KEY`/`useT()` (از `notification-format.ts`) به متن زبان جاری ترجمه می‌شود. فقط `actorName` و `target.label` (چون داده‌ی واقعی/نام موجودیت‌اند نه متن سیستم) هرگز ترجمه نمی‌شوند.
  - **نام عامل رخداد (`actorName`) اگر `actorId` داشته باشد یک لینک است** به `/users/{actorId}` (صفحه‌ی پروفایل عمومی کاربر — رجوع به [features/users/README.md](../users/README.md)) با `stopPropagation` تا کلیک روی نام، کلیک روی کل ردیف (هدایت به مقصد) را trigger نکند.
  - کلیک روی بقیه‌ی ردیف = علامت‌گذاری خوانده‌شده + هدایت به مقصد (`router.push`).
  - اعلان‌های `requiresApproval: true` دو دکمه‌ی «تایید»/«رد» دارند که فقط وضعیت را محلی تغییر می‌دهند؛ همان `requiresApproval` به‌صورت پسوند جدا و ترجمه‌شده (`notifications.needsApproval`) اضافه می‌شود.
- `notifications-preview-dialog.tsx`: پیش‌نمایش هدر مطابق Figma `1723:29972`؛ پنجرهٔ کنار زنگوله با عرض ۳۹۳px، گوشهٔ ۱۶px، بدون سایه، عنوان و نوار تب ۴۸px. همهٔ اعلان‌ها و تب‌های پروژه بر اساس دادهٔ واقعی نمایش داده می‌شوند؛ ردیف به مقصد اعلان می‌رود و وضعیت خوانده‌شده محلی است. تنظیمات به حساب کاربری لینک می‌شود. اواتار از اعضای پروژه می‌آید (در نبود تصویر، حرف اول نام). SVGهای ثابت تنظیمات/جداکننده/نقطهٔ خوانده‌نشده در `public/images/figma/notifications/` هستند.

## وابستگی‌ها

- داده: `src/lib/api/notifications.ts` (`getNotifications`) و تایپ‌های `Notification`/`NotificationTarget`/`NotificationVerb`/`RelativeTime` در `src/lib/api/types.ts`.
- زبان: `components/providers/locale-provider.tsx` (`useT`) — کلیدهای `notifications.verb.*`/`notifications.needsApproval`/`notifications.viewAll`/`notifications.noUnread`/`time.*` در `lib/i18n/dictionary.ts`.
- UI: `components/ui/popover.tsx` فقط برای `NotificationsPreviewDialog` (صفحه‌ی کامل از `Popover`/`Dialog` استفاده نمی‌کند). رجوع به [components/ui/README.md](../../components/ui/README.md) برای تفاوت `Popover` با `Dialog`.
- مصرف‌کننده‌ها: `src/app/(tabs)/notifications/page.tsx` (`NotificationList`) و `src/components/navigation/desktop-header.tsx` (`NotificationsPreviewDialog`، با همان لیست کامل اعلان‌ها که `(tabs)/layout.tsx` واکشی می‌کند).

## ارتباط با بقیه‌ی بخش‌ها

مقصد اعلان‌های نوع `project`/`organization` مستقیم به `/home/projects/[id]` یا `/home/organizations/[id]` می‌رود. مقصد نوع `task` چون هنوز صفحه‌ی جزئیات تسک وجود ندارد، موقتاً به همان صفحه‌ی پروژه‌ی تسک هدایت می‌شود — وقتی آن صفحه ساخته شد، `targetHref()` در `notification-format.ts` باید به‌روزرسانی شود (هر دو مصرف‌کننده خودکار به‌روز می‌شوند).

## نکات ناقص فعلی

- خواندن/تایید فقط در state مرورگر است و با رفرش صفحه بازنشانی می‌شود (API واقعی هنوز وجود ندارد).
- اگر verb جدیدی لازم شد، اول باید کلیدش به `NotificationVerb` (در `types.ts`) و بعد ترجمه‌اش به `dictionary.ts` (هر دو زبان) اضافه شود، بعد در `VERB_KEY` (در `notification-format.ts`) نگاشت داده شود — TypeScript اگر یکی از این‌ها را فراموش کنید خطا می‌دهد.
- دسته‌های مارکتینگ و حسابداری نمونهٔ Figma با پروژه‌های موجود جایگزین شده‌اند؛ مدل دسته‌بندی بین ماژول‌ها فعلاً وجود ندارد.
