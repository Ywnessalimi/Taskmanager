# deploy

این پوشه فایل‌های systemd برای اجرای API، Next standalone و TLS reverse proxy را نگه می‌دارد. برنامه با کاربر سیستم `quire` اجرا می‌شود و دیتابیس در `/var/lib/quire` باقی می‌ماند تا انتشار نسخهٔ تازه داده‌ها را تغییر ندهد.

وابستگی‌ها: Node.js 22، فایل‌های standalone فرانت، بک‌اند و گواهی TLS سرور. مصرف‌کننده‌ها سرویس‌های `quire-api`, `quire-web`, `quire-https` و timer همگام‌سازی گواهی هستند. `quire-api.service` تنظیمات دستیار را از `/etc/quire/quire-ai.env` می‌خواند؛ این فایل باید روی سرور با مالک `root:quire` و مجوز `0640` ساخته شود و هرگز داخل release یا Git قرار نگیرد.

استقرار جدید IP و تمدید گواهی آن در `docs/DEPLOYMENT.md` شرح داده شده است؛ واحد HTTPS همان سرور از پورت ۸۴۴۴ و گواهی نصب‌شده توسط acme.sh استفاده می‌کند.
