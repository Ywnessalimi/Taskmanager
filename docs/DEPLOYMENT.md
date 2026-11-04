# انتشار Quire

## سرور IP جدید

نسخهٔ فعال روی `37.152.187.159` در مسیر `/opt/quire/releases/profile-webp-20261104` نصب شده و `/opt/quire/live` به آن اشاره دارد. آدرس عمومی `https://37.152.187.159:8444` است؛ API و Next به‌ترتیب تنها روی `127.0.0.1:4000` و `127.0.0.1:4001` گوش می‌دهند. سرویس‌های `quire-api`، `quire-web` و `quire-https` با کاربر سیستمی `quire` اجرا می‌شوند و دیتابیس مستقل در `/var/lib/quire/quire.sqlite` است. دیتابیس شامل حساب مدیر و داده‌های نمونهٔ تیم شامل ۱۰ حساب، یک سازمان، دو معاونت، چهار پروژه، تسک‌ها و تیکت‌هاست. آواتارهای نمونه در WebP فشرده شده‌اند؛ پشتیبان دیتابیس پیش از تغییر مسیر آواتارها در `/var/backups/quire/before-avatar-webp-20261104.sqlite` قرار دارد. رمزهای سرور و برنامه در فایل‌های `.env.server-root-password` و `.env.server-app-password` پوشهٔ `backend` دستگاه توسعه با مجوز ۶۰۰ نگه‌داری می‌شوند و در Git نیستند.

گواهی معتبر IP از Let's Encrypt با پروفایل کوتاه‌مدت و `acme.sh` گرفته شده است. فایل `/etc/cron.d/quire-cert-renew` هر دو روز تمدید را با اعتبارسنجی پورت ۸۰ و بارگذاری مجدد `quire-https` اجرا می‌کند؛ کلید و زنجیره در `/var/lib/quire/tls` قرار دارند. باز بودن پورت ۸۰ برای تمدید و ۸۴۴۴ برای دسترسی عمومی لازم است. تنظیمات سرویس و مسیر همگام‌سازی مربوط به سرور قدیمی در بخش بعدی برای آن سرور باقی مانده‌اند.

## وضعیت استقرار قبلی

بک‌اند، Next.js standalone و TLS proxy روی سرور Ubuntu `fastcreate-069773` نصب شده‌اند. سرور با SSH روی پورت `9011` مدیریت می‌شود؛ این پورت برای وب‌سایت نیست. برنامه روی HTTPS پورت `443` گوش می‌دهد، API فقط روی `127.0.0.1:4000` و Next فقط روی `127.0.0.1:4001` در دسترس‌اند.

آدرس برنامه: `https://2.58.172.162/login`. گواهی TLS معتبر IP روی همان سرور تمدید خودکار می‌شود و timer برنامه نسخهٔ محلی آن را همگام می‌کند. UFW ورودی TCP/443 را برای دسترسی عمومی مجاز می‌کند. پاسخ HTTPS و صفحهٔ ورود از داخل سرور با گواهی معتبر بررسی شده‌اند؛ یک آزمون از بیرون در این محیط پیش از ارسال TLS ClientHello reset شد، پس دسترسی از شبکه‌های عمومی هنوز نیاز به تأیید کاربر دارد.

نسخه در `/opt/quire/releases/live-20261020` قرار دارد و `/opt/quire/live` به آن اشاره می‌کند. فایل SQLite در `/var/lib/quire/quire.sqlite` است. دیتابیس تازه یک حساب اولیه دارد و جدول‌های سازمان، معاونت، پروژه، تسک، تیکت و اعلان خالی‌اند. سرویس‌های Radius دست‌نخورده مانده‌اند. سرویس منتقل‌شدهٔ `Julioto` حذف شد؛ تنها نسخهٔ پشتیبان کلاستر PostgreSQL آن در `/var/backups/julioto/database-20261020.sql.gz` نگه داشته شده است.

## سرویس‌ها

- `quire-api.service`: بک‌اند SQLite روی `127.0.0.1:4000` با کاربر سیستمی `quire`.
- `quire-web.service`: فرانت standalone روی `127.0.0.1:4001` با کاربر `quire`.
- `quire-https.service`: TLS proxy روی `0.0.0.0:443`؛ گواهی از نسخهٔ اختصاصی برنامه در `/var/lib/quire/tls/` خوانده می‌شود. سرویس با `CAP_NET_BIND_SERVICE` اجرا می‌شود تا کاربر غیرریشه‌ای `quire` بتواند پورت privileged 443 را bind کند.
- `quire-cert-sync.timer`: هر پنج دقیقه گواهی تمدیدشدهٔ میزبان را به مسیر برنامه کپی می‌کند؛ proxy تغییر گواهی را خودکار بارگذاری می‌کند.

تنظیمات دستیار هوش مصنوعی باید روی سرور در `/etc/quire/quire-ai.env` قرار بگیرند؛ فایل محلی `backend/.env.local` به سرویس systemd منتقل نمی‌شود. فایل فقط باید شامل `AI_API_BASE_URL`، `AI_API_KEY` و `AI_MODEL` باشد، با مالک `root:quire` و مجوز `0640`. فایل unit در `backend/deploy/quire-api.service` آن را به‌عنوان `EnvironmentFile` بارگذاری می‌کند. پس از ساخت یا تغییر فایل:

```bash
systemctl daemon-reload
systemctl restart quire-api
systemctl status quire-api
```

مقدار کلید را در shell history، لاگ یا فرمان‌های قابل مشاهده ننویسید.

وضعیت و لاگ:

```bash
systemctl status quire-api quire-web quire-https
journalctl -u quire-api -n 50
journalctl -u quire-web -n 50
journalctl -u quire-https -n 50
```

## به‌روزرسانی برنامه

بیلد باید روی ماشین توسعه انجام شود؛ سرور کم‌حافظه است و بیلد روی آن اجرا نمی‌شود.

```bash
cd frontend
npm run build -- --webpack
mkdir -p .next/standalone/.next/static
cp -a .next/static/. .next/standalone/.next/static/
cp -a public .next/standalone/public
```

باندل باید شامل `frontend/.next/standalone` و کد/مهاجرت‌های `backend/` باشد؛ `backend/data` و فایل SQLite محلی را وارد باندل نکنید. نسخهٔ جدید را در release تازه داخل `/opt/quire/releases/` استخراج کنید، symlink `/opt/quire/live` را جابه‌جا کنید و این سرویس‌ها را restart کنید:

> **release فعال را پیش از آماده‌شدن نسخهٔ جدید متوقف یا حذف نکنید.** ابتدا باندل را کامل در release جداگانه استخراج کنید، سپس symlink را به نسخهٔ جدید ببرید و سرویس‌ها را restart کنید؛ این کار نسخهٔ قبلی را برای بازگشت نگه می‌دارد.

> **اگر لینک ناپایدار بود:** انتقال یک فایل ۱۲ مگابایتی در یک اتصال ممکن است مدام قطع شود. باندل را با `split -b 512k` تکه کنید، هر تکه را جدا بفرستید و با مقایسه‌ی اندازه تأیید کنید، و در پایان با `cat` روی سرور به‌هم بچسبانید؛ این‌طور قطعی اتصال فقط همان تکه را دوباره می‌فرستد نه کل فایل را. `rsync` روی سرور هست اما روی ماشین ویندوزی توسعه نیست، وگرنه ساده‌ترین راه بود.

```bash
systemctl restart quire-api quire-web quire-https
```

دادهٔ کاربر در `/var/lib/quire/` مستقل از release می‌ماند. migration تازه هنگام شروع API اعمال می‌شود؛ migration اجراشده را ویرایش نکنید.

## حساب نخست

حساب مدیر با `backend/setup-admin.js` و ورودی رمز بدون echo ساخته می‌شود. رمز plain text در فایل‌های پروژه یا تنظیمات systemd ذخیره نمی‌شود. برای نصب فعلی حساب روی دیتابیس خالی ساخته شده است؛ اجرای دوبارهٔ bootstrap روی دیتابیسی که کاربر دارد مجاز نیست.

## پورت عمومی برنامه

برای دسترسی عمومی به برنامه، پورت HTTPS را در UFW باز کنید:

```bash
ufw allow 443/tcp comment "Quire HTTPS"
ufw delete allow 9444/tcp
```

پورت‌های `9011` (SSH)، `9443` (Radius HTTPS)، `8443` و سرویس‌های موجود را برای استقرار Quire تغییر ندهید. 443 تنها مسیر عمومی برنامه است؛ دو سرویس داخلی بک‌اند و Next روی loopback باقی می‌مانند. پورت 9444 دیگر listener یا قانون UFW ندارد.
