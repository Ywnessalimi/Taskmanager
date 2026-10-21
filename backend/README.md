# Backend

سرویس Node.js برای ورود نشست‌محور و ذخیرهٔ پایدار داده‌های Quire در SQLite. HTTP با `node:http` و دیتابیس با ماژول داخلی `node:sqlite` اجرا می‌شوند.

## اجرا

```bash
npm run dev
npm run setup:admin
```

نیازمند Node.js 22.13 یا جدیدتر است. در اجرای نخست، `npm run setup:admin` حساب اولیه را در دیتابیس خالی می‌سازد و رمز را بدون نمایش در ترمینال می‌گیرد. API روی `http://127.0.0.1:4000` اجرا می‌شود و Next مسیر `/api/v1` را به آن می‌فرستد. جزئیات env، schema، endpointها و مسیر مهاجرت در [docs/BACKEND.md](../docs/BACKEND.md) ثبت شده است.

## مسئولیت ماژول‌ها

- `server.js`: ورودی HTTP، اعتبارسنجی درخواست، routeها و قالب خطاهای API.
- `database.js`: بازکردن SQLite، foreign keyها و اجرای migrationهای نسخه‌بندی‌شده؛ seed فقط با انتخاب صریح فعال می‌شود.
- `apps/auth/`: حساب اولیه، هش رمز با scrypt، نشست‌های ۳۰روزه و ابطال نشست.
- `apps/organizations/`: سلسله‌مراتب و مالکیت سازمان، معاونت و پروژه.
- `task-repository.js`: عملیات پایگاه داده و تبدیل سطرها به قرارداد Task فرانت.
- `apps/tickets/ticket-comment-repository.js`: خواندن/ثبت کامنت‌های تیکت در SQLite با زمان ایجاد سروری.
- `apps/projects/project-page-repository.js`: ذخیرهٔ یک سند و یک چت برای هر پروژه و پیام‌های چت؛ مسیرهای آن در `docs/BACKEND.md` آمده‌اند.
- `apps/notifications/notification-repository.js`: ایجاد اعلان پایدار برای مسئولان هنگام ساخت/تخصیص تسک و نگهداری وضعیت خوانده‌شدن.
- `migrations/`: schema تکامل‌پذیر؛ migration اعمال‌شده را ویرایش نکنید.
- `test/`: تست‌های داخلی Node روی پایگاه موقت.

دیتابیس اجرای سرویس با دادهٔ دمو seed نمی‌شود. حساب نخست با `npm run setup:admin` یا متغیرهای `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_NAME`, `INITIAL_ADMIN_PASSWORD` ساخته می‌شود. APIهای داده نشست معتبر می‌خواهند؛ cookie نشست `HttpOnly`, `SameSite=Lax` است و در production به‌طور پیش‌فرض `Secure` می‌شود. پیوست‌ها، عضویت چندکاربره و پیوند Ticket به Task هنوز سمت سرور نیستند.
