# انتشار Quire

## وضعیت استقرار

بک‌اند، Next.js standalone و TLS proxy روی سرور Ubuntu `fastcreate-069773` نصب شده‌اند. سرور با SSH روی پورت `9011` مدیریت می‌شود؛ این پورت برای وب‌سایت نیست. برنامه روی HTTPS پورت `443` گوش می‌دهد، API فقط روی `127.0.0.1:4000` و Next فقط روی `127.0.0.1:4001` در دسترس‌اند.

آدرس برنامه: `https://2.58.172.162/login`. گواهی TLS معتبر IP روی همان سرور تمدید خودکار می‌شود و timer برنامه نسخهٔ محلی آن را همگام می‌کند. UFW ورودی TCP/443 را برای دسترسی عمومی مجاز می‌کند. پاسخ HTTPS و صفحهٔ ورود از داخل سرور با گواهی معتبر بررسی شده‌اند؛ یک آزمون از بیرون در این محیط پیش از ارسال TLS ClientHello reset شد، پس دسترسی از شبکه‌های عمومی هنوز نیاز به تأیید کاربر دارد.

نسخه در `/opt/quire/releases/live-20261020` قرار دارد و `/opt/quire/live` به آن اشاره می‌کند. فایل SQLite در `/var/lib/quire/quire.sqlite` است. دیتابیس تازه یک حساب اولیه دارد و جدول‌های سازمان، معاونت، پروژه، تسک، تیکت و اعلان خالی‌اند. سرویس‌های Radius دست‌نخورده مانده‌اند. سرویس منتقل‌شدهٔ `Julioto` حذف شد؛ تنها نسخهٔ پشتیبان کلاستر PostgreSQL آن در `/var/backups/julioto/database-20261020.sql.gz` نگه داشته شده است.

## سرویس‌ها

- `quire-api.service`: بک‌اند SQLite روی `127.0.0.1:4000` با کاربر سیستمی `quire`.
- `quire-web.service`: فرانت standalone روی `127.0.0.1:4001` با کاربر `quire`.
- `quire-https.service`: TLS proxy روی `0.0.0.0:443`؛ گواهی از نسخهٔ اختصاصی برنامه در `/var/lib/quire/tls/` خوانده می‌شود. سرویس با `CAP_NET_BIND_SERVICE` اجرا می‌شود تا کاربر غیرریشه‌ای `quire` بتواند پورت privileged 443 را bind کند.
- `quire-cert-sync.timer`: هر پنج دقیقه گواهی تمدیدشدهٔ میزبان را به مسیر برنامه کپی می‌کند؛ proxy تغییر گواهی را خودکار بارگذاری می‌کند.

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
