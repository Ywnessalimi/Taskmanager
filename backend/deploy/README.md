# deploy

این پوشه فایل‌های systemd برای اجرای API، Next standalone و TLS reverse proxy را نگه می‌دارد. برنامه با کاربر سیستم `quire` اجرا می‌شود و دیتابیس در `/var/lib/quire` باقی می‌ماند تا انتشار نسخهٔ تازه داده‌ها را تغییر ندهد.

وابستگی‌ها: Node.js 22، فایل‌های standalone فرانت، بک‌اند و گواهی TLS سرور. مصرف‌کننده‌ها سرویس‌های `quire-api`, `quire-web`, `quire-https` و timer همگام‌سازی گواهی هستند.
