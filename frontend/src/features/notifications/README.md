# features/notifications

اعلان‌های واقعی تخصیص Task در صفحهٔ `/notifications` و پیش‌نمایش هدر دسکتاپ نمایش داده می‌شوند. هنگام ساخت Task برای مسئولان، بک‌اند رکورد پایدار می‌سازد؛ کلیک روی اعلان آن را خوانده و workspace جزئیات همان Task را باز می‌کند.

## اجزا

- `notification-format.ts`: نگاشت متن رخداد، فرمت زمان سروری و مقصد کلیک. مقصد Task به `/tasks/[taskId]` می‌رود.
- `notifications-preview-dialog.tsx`: ردیف‌ها و تب‌های پروژه را میان `NotificationsFullPage` و `NotificationsPreviewDialog` مشترک می‌کند. صفحهٔ کامل دکمهٔ تنظیمات ندارد؛ پیش‌نمایش هدر دسکتاپ لینک تنظیمات دارد.
- `notification-list.tsx`: پیاده‌سازی قدیمی فیلترهای همه/خوانده‌شده/تایید است و دیگر مصرف‌کنندهٔ مسیر اصلی نیست.

## وابستگی‌ها و مصرف‌کننده‌ها

- `lib/api/notifications.ts` برای خواندن و علامت‌گذاری اعلان؛ `lib/api/tasks.ts` برای ثبت Task با هویت سازنده؛ تایپ‌ها در `lib/api/types.ts`.
- API بک‌اند در `backend/apps/notifications/notification-repository.js` و جدول `notifications` در SQLite. چون Auth وجود ندارد، گیرنده با نام کاربر جاری فیلتر می‌شود.
- `/notifications` و `BottomTabBar` صفحهٔ کامل را مصرف می‌کنند؛ `DesktopHeader` پیش‌نمایش را مصرف می‌کند.
- در حال حاضر فقط تخصیص Task اعلان تولید می‌کند؛ کامنت و دیگر تغییرات هنوز اعلان نمی‌شوند. تنظیمات تایید نیز در این فاز کامل نیست.
