# دیپلوی (Deployment)

> این سند فقط نحوه‌ی اجرای پروژه روی سرور نمایشی را توضیح می‌دهد. معماری کد در [FRONTEND.md](./FRONTEND.md) است.

## وضعیت فعلی

نسخه‌ی نمایشی فرانت‌اند روی سرور مجازی اوبونتو اجراست:

- آدرس: `http://<SERVER_IP>:8080`
- مسیر روی سرور: `/opt/quire/app`
- سرویس: `quire.service` (systemd، با `Restart=on-failure` و فعال بعد از ریبوت)
- Node: نسخه‌ی ۲۲ از مخزن NodeSource

روی همان سرور یک استک داکری دیگر (`julioto-*`) روی پورت‌های ۸۰/۴۴۳ در حال اجراست. این دیپلوی **هیچ تماسی با آن ندارد**: پورت جدا، سرویس جدا، بدون تغییر در nginx یا داکر.

## چرا خروجی standalone

`frontend/next.config.ts` مقدار `output: "standalone"` دارد. سرور فقط ۲ گیگ رم دارد و یک سرویس واقعی هم روی آن است، پس **بیلد گرفتن روی سرور امن نیست** (احتمال OOM و آسیب به سرویس در حال اجرا). به‌جای آن:

1. بیلد روی ماشین توسعه گرفته می‌شود.
2. خروجی `.next/standalone` (که سرور Node و فقط وابستگی‌های لازم را در خود دارد) به سرور منتقل می‌شود.
3. روی سرور نه `npm install` اجرا می‌شود و نه `next build` — فقط `node server.js`.

## دسترسی SSH

اتصال به سرور با **کلید SSH** انجام می‌شود، نه رمز عبور. روی ماشین توسعه یک کلید `ed25519` در `~/.ssh/quire-server` ساخته شده و کلید عمومی‌اش در `/root/.ssh/authorized_keys` سرور نصب است. یک ورودی هم در `~/.ssh/config` اضافه شده تا دستورها کوتاه بمانند:

```
Host quire
    HostName <SERVER_IP>
    Port <SSH_PORT>
    User root
    IdentityFile ~/.ssh/quire-server
    IdentitiesOnly yes
```

بعد از آن کافی است:

```bash
ssh quire
```

> کلید **خصوصی** (`~/.ssh/quire-server`، بدون پسوند) هرگز جایی فرستاده نمی‌شود؛ فقط فایل `.pub` روی سرورها نصب می‌شود. برای افزودن ماشین دوم، یک کلید جدا برای همان ماشین ساخته شود و کلید عمومی‌اش به `authorized_keys` اضافه شود — کپی‌کردن کلید خصوصی بین دستگاه‌ها کار درستی نیست.

## مراحل انتشار نسخه‌ی جدید

```bash
# ۱) بیلد روی ماشین توسعه
cd frontend
npm run build

# ۲) ساخت باندل (دقت: نقطه‌ی انتهای مسیر لازم است تا پوشه‌ی مخفی .next هم کپی شود)
rm -rf /tmp/bundle && mkdir -p /tmp/bundle
cp -a .next/standalone/. /tmp/bundle/
cp -a .next/static /tmp/bundle/.next/static
cp -a public /tmp/bundle/public
tar czf /tmp/quire.tar.gz -C /tmp/bundle .

# ۳) انتقال و راه‌اندازی مجدد
ssh quire "systemctl stop quire && rm -rf /opt/quire/app && mkdir -p /opt/quire/app && cat > /opt/quire/quire.tar.gz" < /tmp/quire.tar.gz
ssh quire "tar xzf /opt/quire/quire.tar.gz -C /opt/quire/app && systemctl start quire && systemctl is-active quire"
```

> **تله‌ی مهم:** `cp -r .next/standalone/*` کار نمی‌کند — گلاب پوسته پوشه‌ی مخفی `.next/standalone/.next` (که BUILD_ID و کد سرور در آن است) را نادیده می‌گیرد و سرور با خطای «Could not find a production build» بالا نمی‌آید. حتماً `cp -a .../.` استفاده شود.

## فایل سرویس

`/etc/systemd/system/quire.service`:

```ini
[Unit]
Description=Quire clone (Next.js demo)
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/quire/app
Environment=NODE_ENV=production
Environment=PORT=8080
Environment=HOSTNAME=0.0.0.0
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5
User=root

[Install]
WantedBy=multi-user.target
```

دستورهای پرکاربرد:

```bash
systemctl status quire          # وضعیت
journalctl -u quire -n 50       # لاگ
systemctl restart quire         # ری‌استارت
```

## شبکه

فایروال `ufw` فعال است. برای دسترسی عمومی به نسخه‌ی نمایشی یک قانون اضافه شده:

```bash
ufw allow 8080/tcp comment "quire demo"
```

برخلاف ۸۰/۴۴۳ که فقط به رنج آی‌پی‌های Cloudflare باز است، پورت ۸۰۸۰ **برای همه باز است** — چون هدف همین بود که با آی‌پی و پورت به دیگران نشان داده شود.

## نکات امنیتی این دیپلوی

- سرویس فعلاً با کاربر `root` اجرا می‌شود (ساده‌ترین حالت برای یک دمو). برای چیزی جدی‌تر باید یک کاربر بدون امتیاز ساخته شود و `User=` تغییر کند.
- ترافیک روی HTTP ساده است، نه HTTPS. برای دموی داده‌ی ساختگی مشکلی ندارد؛ اگر روزی داده‌ی واقعی یا لاگین اضافه شد، باید پشت همان nginx/Cloudflare با TLS برود.
- اپ هنوز احراز هویت ندارد و هرکسی که لینک را داشته باشد همه‌چیز را می‌بیند. داده‌ها Mock و ساختگی‌اند.

## بعد از خاموش‌کردن دمو

```bash
systemctl disable --now quire
ufw delete allow 8080/tcp
rm -rf /opt/quire
```
