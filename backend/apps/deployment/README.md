# Deployment proxy

این ماژول TLS را روی پورت عمومی Terminate می‌کند و درخواست‌ها را به Next.js محلی می‌فرستد. گواهی و کلید از مسیرهای محیطی خوانده می‌شوند؛ پروکسی پس از تمدید خودکار گواهی، context پیش‌فرض TLS را تازه می‌کند.

وابستگی‌ها: ماژول‌های داخلی `node:https`, `node:http`, `node:tls` و `node:fs`؛ متغیرهای `TLS_CERT_PATH`, `TLS_KEY_PATH`, `FRONTEND_ORIGIN`, `PROXY_HOST`, `PROXY_PORT`. مصرف‌کننده: سرویس systemd برنامهٔ Quire روی سرور؛ درخواست‌های `/api/v1` از Next به بک‌اند SQLite منتقل می‌شوند.
