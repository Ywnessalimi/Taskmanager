# مستند بک‌اند (Backend)

> پیش‌نیاز خواندن: [PRODUCT_OVERVIEW.md](./PRODUCT_OVERVIEW.md).
> بک‌اند قابل‌اجرا در [`backend/`](../backend/) یک سرویس کوچک Node.js است؛ این سند وضعیت واقعی کد را ثبت می‌کند.

## ۱. هدف و محدوده

این سرویس داده‌های پایدار Quire و ورود تک‌حسابی را در SQLite نگه می‌دارد. در اجرای واقعی هیچ Organization، Project، Task یا Ticket دمو seed نمی‌شود؛ فقط حساب اولیه‌ای که مالک سیستم است ساخته می‌شود. ثبت‌نام عمومی وجود ندارد. endpointهای داده نشست معتبر می‌خواهند و شناسهٔ عامل از همان نشست می‌آید.

- زمان اجرا: Node.js 22.13 یا جدیدتر؛ ارتباط مدل با `fetch` داخلی Node انجام می‌شود و وابستگی npm اضافه‌ای ندارد.
- HTTP: ماژول داخلی `node:http`.
- پایگاه داده: SQLite از ماژول داخلی `node:sqlite`.
- مدل اجرا: تک‌پردازه و هم‌زمانی کم؛ `DatabaseSync` عملیات پایگاه داده را همگام اجرا می‌کند. برای بار یا چند نمونهٔ سرویس مناسب نیست.
- مرز API: `/api/v1` مستقل از جزئیات SQLite است؛ فرانت‌اند فقط با API و لایهٔ `frontend/src/lib/api/` کار می‌کند.

`node:sqlite` از Node 22.13 بدون فلگ آزمایشی در دسترس است، اما در نسخهٔ Node 22 هنوز Stability 1.1 (Active Development) دارد. این انتخاب عمداً بدون وابستگی بیرونی است؛ زمان ارتقای Node یا نیاز به پایداری بیشتر، adapter ذخیره‌سازی باید بازبینی شود.

## ۲. ساختار کد

```text
backend/
  package.json                 → اجرا و تست با ابزارهای داخلی Node
  server.js                    → HTTP، مسیرها، اعتبارسنجی ورودی و پاسخ خطا
  database.js                  → اتصال SQLite، اعمال migration و seed اولیه
  task-repository.js           → تبدیل مدل Task به ردیف SQLite و عملیات CRUD
  apps/
    auth/
      README.md                → احراز هویت، حساب اولیه و نشست
      auth-repository.js       → بررسی رمز، ساخت و ابطال نشست
    organizations/
      README.md                → عضویت، مجوزها و مالکیت سلسله‌مراتب سازمانی
      organization-repository.js → سازمان، معاونت و پروژهٔ کاربر
    tickets/
      README.md                → مسئولیت و قرارداد کامنت تیکت
      ticket-comment-repository.js → خواندن/ثبت کامنت با زمان سرور
      ticket-repository.js     → رکورد Ticket و Activity پایدار
    notifications/
      README.md                → قرارداد اعلان تخصیص تسک
      notification-repository.js → ثبت، خواندن و علامت‌گذاری اعلان
    projects/
      README.md                → مسئولیت API صفحه‌های پروژه
      project-page-repository.js → سند و پیام‌های چت پروژه
    ai/
      README.md                → اتصال امن دستیار به API مدل Nokod
      ai-service.js            → ارسال پیام‌های گفت‌وگو به مدل و اعتبارسنجی پاسخ
  seed-data.js                 → چند پروژه و تسک نمونه برای شروع کار محلی
  migrations/
    001_initial.sql            → طرح اولیهٔ پروژه و تسک + محدودیت‌های داده
    002_task_display_sequence.sql → شمارندهٔ پایدار شناسهٔ نمایشی تسک
    003_ticket_comments.sql    → جدول و index کامنت‌های تیکت
    004_tickets_and_activity.sql → جدول Ticket و Activity
    005_project_pages_and_chat.sql → سند و پیام‌های چت هر پروژه
    006_notifications.sql      → اعلان‌های پایدار تخصیص Task
    007_users_and_sessions.sql → حساب‌ها و نشست‌های احراز‌شده
    008_organizations_and_divisions.sql → مالکیت سازمان/معاونت و سازگاری پروژه
    009_ticket_assignment_notifications.sql → اعلان ارجاع Ticket و مقصد Ticket
    010_organization_settings_and_members.sql → slug، تصویر و عضویت/مجوزهای سازمان
    011_organization_activity.sql → رخدادهای سازمان و کامنت‌های فید
  test/
    task-repository.test.js    → تست migration و CRUD روی دیتابیس موقت
  data/                         → quire.sqlite (ساخته می‌شود، در Git نیست)
```

ماژول‌های دامنهٔ Task و Tickets هرکدام مسئولیت جدا دارند؛ فایل‌های HTTP و SQLite جزئیات اجرایی‌اند. Ticketها در جدول `tickets` ذخیره می‌شوند. جدول کامنت برای سازگاری با شناسه‌های پایدار فعلی، `ticket_id` متنی دارد؛ Activity جدید به جدول Ticket کلید خارجی دارد.

## ۳. تنظیمات و راه‌اندازی

متغیرهای محیطی اختیاری:

| متغیر | پیش‌فرض | کارکرد |
|---|---|---|
| `HOST` | `127.0.0.1` | آدرس bind سرویس؛ پیش‌فرض فقط روی همین دستگاه |
| `PORT` | `4000` | پورت HTTP |
| `DATABASE_PATH` | `backend/data/quire-live.sqlite` | مسیر فایل SQLite؛ مسیر پوشه در صورت نیاز ساخته می‌شود |
| `FRONTEND_ORIGINS` | `http://127.0.0.1:3000,http://localhost:3000` | مبدأهای مجاز مرورگر، جداشده با کاما |
| `INITIAL_ADMIN_EMAIL` | خالی | ایمیل حساب نخست؛ همراه با دو متغیر دیگر حساب را ایجاد می‌کند |
| `INITIAL_ADMIN_NAME` | `Younes Salimi` | نام نمایشی حساب نخست |
| `INITIAL_ADMIN_PASSWORD` | خالی | رمز اولیه؛ حداقل ۱۲ نویسه، فقط برای ایجاد اولین حساب |
| `SESSION_COOKIE_SECURE` | `true` در production | ویژگی `Secure` cookie نشست؛ در HTTP محلی `false` بگذارید |
| `AI_API_BASE_URL` | `https://service.nokod.ir/v1` | آدرس پایهٔ API سازگار با OpenAI |
| `AI_API_KEY` | خالی | کلید خصوصی سرویس مدل؛ فقط در محیط بک‌اند، نه در فرانت‌اند |
| `AI_MODEL` | `Qwen38` | شناسهٔ مدل در سرویس |

برای توسعهٔ محلی می‌توان این متغیرها را در `backend/.env.local` قرار داد؛ این فایل نادیده‌گرفته‌شده در Git است و اسکریپت‌های `dev` و `start` آن را با Node بارگذاری می‌کنند. کلید را در متغیرهای `NEXT_PUBLIC_*` یا کد مرورگر قرار ندهید.

```bash
npm --prefix backend run dev
npm --prefix backend run setup:admin
```

برای اجرای فرانت، ترمینال دوم:

```bash
npm --prefix frontend run dev
```

پاسخ سلامت: `GET http://127.0.0.1:4000/health`. مرورگر API را از مسیر هم‌مبدأ `/api/v1` فراخوانی می‌کند؛ Next آن را به API محلی می‌فرستد. Server Componentها با `QUIRE_API_ORIGIN` به سرویس بک‌اند وصل می‌شوند.

دیتابیس اجرای سرور خودکار دادهٔ نمونه نمی‌گیرد. پس از migrationها، حساب نخست را با `npm --prefix backend run setup:admin` بسازید؛ این فرمان رمز را بدون نمایش در ترمینال دریافت می‌کند و فقط روی دیتابیسی کار می‌کند که هنوز حسابی ندارد. برای bootstrap غیرتعاملی می‌توان متغیرهای `INITIAL_ADMIN_*` را یک‌بار به محیط فرایند داد. برای محیط محلی، `npm --prefix backend run seed:demo` به‌صورت صریح چهار حساب و داده‌های نمونهٔ سازمانی، پروژه، تسک و تیکت می‌سازد؛ رمز تصادفی هر حساب فقط در خروجی همان اجرا نمایش داده می‌شود و seed تکراری را دوباره درج نمی‌کند. `seed-data.js` برای سناریوهای قدیمی تست باقی مانده است؛ فایل `quire-live.sqlite` دیتابیس فعال است.

## ۴. مدل داده و ذخیره‌سازی

### `projects`

- `id` شناسهٔ پایدار متناظر با شناسهٔ فرانت مثل `proj-1`.
- `name`, `organization_id`, `organization_name`, `division_id`, `division_name`.
- `start_date`, `end_date`, `description`.

ساختار واقعی با endpointهای احراز‌شدهٔ Organization، Division و Project ساخته می‌شود. هر سازمان مالک حساب جاری دارد و فهرست پروژه‌ها بر اساس همان مالک محدود می‌شود. محتوای صفحه‌های پروژه در جدول `project_pages` نگه‌داری می‌شود؛ پیام‌های چت در `project_chat_messages` با هویت نشست و زمان سروری ثبت می‌شوند.

### `tasks`

- `id` شناسهٔ UUID و `display_id` شناسهٔ قابل‌نمایش. شمارندهٔ جداگانه باعث می‌شود حذف آخرین Task شناسهٔ نمایشی را برای Task بعدی بازیافت نکند.
- `project_id` کلید خارجی؛ حذف پروژهٔ مرجع در این API پشتیبانی نمی‌شود.
- `title`, `status`, `priority`, `start_date`, `due_date`, `repeat`, `recurrence`, `description`.
- `assignee_names`, `followers`, `tags`, `subtasks`, `activity_log` به‌صورت JSON معتبر در ستون‌های `TEXT`؛ این کار فاز نمونه را کوچک نگه می‌دارد.
- جزئیات زیرتسک (همان فیلدهای قابل‌ویرایش تسک) در آرایهٔ `subtasks` رکورد تسک مادر ذخیره می‌شود. ویرایش زیرتسک از `PATCH /api/v1/tasks/:id` مادر استفاده می‌کند؛ زیرتسک رکورد مستقل Board یا endpoint مستقل ندارد و در این فاز فقط یک سطح زیرتسک پشتیبانی می‌شود.
- `is_favorite`, `time_spent_minutes`, `created_at`, `updated_at`.

Status و Priority با `CHECK` محدود می‌شوند و foreign key فعال است. تاریخ‌های محصول رشته‌اند چون نمونه‌های فعلی تاریخ جلالی دارند؛ API آن‌ها را بدون تبدیل تقویمی نگه می‌دارد. SQL فقط در migration و repository قرار دارد؛ همهٔ ورودی‌ها به statementهای پارامتری bind می‌شوند.

فیلدهای آرایه‌ای فعلاً JSON هستند تا مدل و فرم موجود بدون تغییر مفهوم ذخیره شوند. اگر گزارش‌گیری/جست‌وجوی رابطه‌ای روی Assignee/Tag/Subtask لازم شد، migration جدید این مقدارها را به جدول‌های رابطه‌ای می‌برد؛ تغییر schema با فایل migration تازه انجام می‌شود، نه ویرایش migration اعمال‌شده.

### `ticket_comments`

- `id` شناسهٔ UUID کامنت و `ticket_id` شناسهٔ تیکت در قرارداد فرانت‌اند.
- `author_id`, `author_name`, `author_avatar_url` مشخصات نویسندهٔ جاری؛ چون Auth وجود ندارد، این مقادیر از فرانت ارسال می‌شوند.
- `body` متن کامنت و `created_at` زمان UTC که هنگام درج در سرور تولید می‌شود.
- index ترکیبی روی تیکت و ترتیب ایجاد، تاریخچه را به ترتیب ثبت برمی‌گرداند.

### `notifications`

اعلان `taskAssigned` هنگام تخصیص Task و `ticketAssigned` هنگام ارجاع Ticket برای گیرنده ثبت می‌شود. گیرنده با نام حساب جاری فیلتر می‌شود. مقصد اعلان می‌تواند Task یا Ticket باشد؛ `project_id` برای Ticket بدون پروژه خالی می‌ماند. زمان UTC و وضعیت خوانده‌شدن در SQLite نگه‌داری می‌شوند. migration `009_ticket_assignment_notifications.sql` constraintهای جدول را برای رویداد و مقصد Ticket گسترش می‌دهد.

این جدول با migration `003_ticket_comments.sql` ساخته می‌شود. فایل‌های پیوست از جدول کامنت جدا هستند و این endpoint متن را ذخیره می‌کند.

### `tickets` و `ticket_activity`

در PUT یک تیکت موجود، مشخصات سازنده (`createdById`, `createdByName`, `createdByAvatarUrl`) از رکورد قبلی حفظ می‌شوند؛ هویت کاربر نشست جاری فقط به‌عنوان عامل تغییر در Activity ثبت می‌شود.

Ticket با شناسهٔ پایدار، بدنهٔ JSON قرارداد فرانت (از جمله اولویت اختیاری `none`/`low`/`medium`/`high`/`urgent`)، و زمان ساخت/به‌روزرسانی در SQLite نگه‌داری می‌شود. تغییر اولویت نیز در Activity جزو تغییرات جزئیات ثبت می‌شود. Activity هر تغییر ارجاع، وضعیت، دنبال‌کردن، علاقه‌مندی، جزئیات و کامنت را با عامل و زمان UTC سرور ثبت می‌کند. ردیف‌ها بر اساس `created_at` از قدیمی به جدید خوانده می‌شوند. این جدول‌ها با migration `004_tickets_and_activity.sql` ساخته می‌شوند.

### `users` و `sessions`

حساب نخست از تنظیمات bootstrap ساخته می‌شود. رمز با `scrypt` و salt تصادفی ذخیره می‌شود. Cookie شامل token تصادفی است؛ فقط SHA-256 آن در جدول `sessions` نگه‌داری می‌شود. شناسهٔ عمومی تصادفی هر نشست برای فهرست/لغو از hash توکن جداست. User-Agent مرورگر هنگام ورود ثبت و برای نمایش نام مرورگر و نوع دستگاه تفسیر می‌شود؛ فرانت مقدار مرورگر را با header داخلی `x-quire-user-agent` می‌فرستد تا User-Agent عمومی درخواست‌های سروری Next.js جای آن را نگیرد. `last_seen_at` با هر درخواست احراز‌شده به‌روز می‌شود. API فقط نشست‌های متعلق به کاربر جاری را فهرست یا لغو می‌کند. عمر نشست ۳۰ روز است و خروج نشست را حذف می‌کند. Cookie دارای `HttpOnly`, `SameSite=Lax`, `Path=/` است و در production دارای `Secure` نیز هست.

### `organizations` و `organization_members`

سازمان `slug` یکتا از حروف هر زبان، عدد و خط تیره، توضیحات، تصویر data URL محدود و `preferences_json` برای گزینه‌های سازمان دارد. `organization_members` کلید سازمان/کاربر دارد و نقش‌های `owner`, `admin`, `custom` را نگه‌داری می‌کند؛ مجوزهای نقش سفارشی در JSON با کلیدهای `editOrganization`, `createDivision`, `editDivision`, `createProject`, `editProject`, `inviteMembers`, `removeMembers`, `manageAccess` قرار دارند. migration `010_organization_settings_and_members.sql` مالک فعلی را به عضویت owner تبدیل می‌کند. نقش admin فقط `manageAccess` دارد؛ تنها یک owner مجاز است و repository انتقال مالکیت را اتمیک انجام می‌دهد. دعوت عضو در این فاز به ایمیل حساب موجود متصل می‌شود. `organization_activity` رویدادهای ساخت تسک، تغییر وضعیت تسک و کامنت سازمان را با عامل، زمان UTC، شناسهٔ تسک اختیاری و جزئیات JSON ذخیره می‌کند؛ پاک‌شدن سازمان رخدادهایش را نیز پاک می‌کند. فید از تازه‌ترین ردیف شروع می‌شود و برای صفحه‌های قدیمی‌تر از cursor پایدار `rowid` استفاده می‌کند.

## ۵. API نسخهٔ ۱

همهٔ پاسخ‌ها JSON‌اند مگر `204 No Content`. همهٔ endpointهای `/api/v1/*` به‌جز ورود، دریافت نشست و خروج، cookie نشست معتبر می‌خواهند. شناسه‌های Task در مسیر URL استفاده می‌شوند.

مسیر دستیار حداکثر ۲۰ پیام با محتوای حداکثر ۶۰۰۰ نویسه می‌پذیرد و فقط وقتی آخرین پیام از نقش `user` باشد درخواست را می‌فرستد. پیام سیستمی سمت سرور اضافه می‌شود؛ ابزارهای ساخت/ویرایش اجرا نمی‌شوند. پاسخ ارائه‌دهنده به متن محدود است و خطاهای upstream بدون بدنه یا کلید به کلاینت برمی‌گردند. درخواست از مسیر `POST /chat/completions` با Bearer token و قرارداد OpenAI-compatible ارسال می‌شود.

| Method | Path | رفتار |
|---|---|---|
| `GET` | `/health` | وضعیت سرویس و اتصال پایگاه داده |
| `POST` | `/api/v1/auth/login` | ورود با ایمیل و رمز؛ cookie نشست و کاربر را برمی‌گرداند |
| `GET` | `/api/v1/auth/me` | کاربر نشست جاری یا `401` |
| `PATCH` | `/api/v1/auth/me` | ذخیرهٔ نام، ایمیل، توضیحات و تصویر پروفایل حساب جاری؛ عکس داده‌ای تصویری محدودشده است |
| `GET` | `/api/v1/auth/sessions` | فهرست نشست‌های کاربر جاری با دستگاه، مرورگر، زمان ساخت، آخرین فعالیت و نشان نشست جاری |
| `DELETE` | `/api/v1/auth/sessions/:sessionId` | لغو نشست متعلق به کاربر جاری؛ لغو نشست جاری cookie را نیز پاک می‌کند |
| `POST` | `/api/v1/auth/logout` | حذف نشست و پاک‌کردن cookie |
| `POST` | `/api/v1/assistant/chat` | ارسال تاریخچهٔ محدود گفت‌وگو به Nokod؛ نشست معتبر لازم دارد |
| `GET` | `/api/v1/organizations` | سلسله‌مراتب سازمان/معاونت/پروژه برای عضو نشست |
| `POST` | `/api/v1/organizations` | ساخت سازمان و عضویت owner برای کاربر جاری |
| `GET` | `/api/v1/organizations/:organizationId/members` | اعضا و مجوزهای سازمان برای عضو مجاز |
| `POST` | `/api/v1/organizations/:organizationId/members` | افزودن حساب موجود با ایمیل؛ مجوز دعوت یا مدیریت دسترسی |
| `PATCH` | `/api/v1/organizations/:organizationId/members/:userId` | تغییر نقش/مجوز عضو؛ یکتایی مالک در سرور اعمال می‌شود |
| `DELETE` | `/api/v1/organizations/:organizationId/members/:userId` | حذف عضو؛ مالک حذف‌ناپذیر است |
| `PATCH` | `/api/v1/organizations/:organizationId/settings` | ذخیرهٔ نام، توضیحات، تصویر، slug و گزینه‌ها |
| `GET` | `/api/v1/organizations/:organizationId/activity?limit=15&before=:cursor` | رخدادهای سازمان برای عضو مجاز، تازه‌ترین ابتدا؛ حداکثر ۵۰ ردیف در هر صفحه و cursor اختیاری برای صفحه‌های قدیمی‌تر |
| `POST` | `/api/v1/organizations/:organizationId/activity` | ثبت کامنت در فید سازمان؛ متن حداکثر ۱۰٬۰۰۰ نویسه است و هویت نویسنده از نشست می‌آید |
| `GET` | `/api/v1/organizations/by-slug/:organizationSlug` | خواندن سازمان برای مسیر خوانا با عضویت معتبر |
| `GET` | `/api/v1/organizations/by-slug/:organizationSlug/projects/:projectSlug` | خواندن پروژه با slug سازمان/پروژه برای عضو مجاز |
| `POST` | `/api/v1/organizations/:organizationId/divisions` | ساخت معاونت با مجوز `createDivision` |
| `PATCH` | `/api/v1/organizations/:organizationId/divisions/:divisionId` | انتقال معاونت به سازمان مقصد؛ مالکیت سازمان مبدأ و مقصد در نشست بررسی می‌شود و تعارض نام `409` است |
| `POST` | `/api/v1/divisions/:divisionId/projects` | ساخت پروژه با مجوز `createProject` |
| `PATCH` | `/api/v1/projects/:projectId/location` | انتقال پروژه به معاونت مقصد؛ مالکیت پروژهٔ مبدأ و معاونت مقصد در نشست بررسی می‌شود |
| `PATCH` | `/api/v1/projects/:projectId/settings` | ذخیرهٔ خودکار نام و توضیحات پروژه با مجوز `editProject`؛ slug پایدار می‌ماند |
| `GET` | `/api/v1/projects` | پروژه‌های مرجع |
| `GET` | `/api/v1/projects/:projectId` | یک پروژه یا `404` |
| `GET` | `/api/v1/projects/:projectId/tasks` | Taskهای ریشهٔ پروژه با Subtaskهایشان |
| `GET` | `/api/v1/projects/:projectId/pages` | صفحه‌های سند/چت پروژه |
| `PUT` | `/api/v1/projects/:projectId/pages/:kind` | ذخیرهٔ عنوان و متن صفحه (`kind`: `document` یا `chat`)؛ هر نوع برای هر پروژه یکتا است |
| `GET` | `/api/v1/projects/:projectId/chat` | پیام‌های چت پروژه به ترتیب زمان |
| `POST` | `/api/v1/projects/:projectId/chat` | ثبت پیام با `authorName` و `text`؛ زمان و شناسه را سرور می‌سازد |
| `GET` | `/api/v1/tasks` | Taskهای ریشه؛ فیلتر اختیاری `projectId` و `assigneeName` |
| `GET` | `/api/v1/tasks/:id` | خواندن Task |
| `POST` | `/api/v1/tasks` | ساخت Task؛ `projectId` و `title` اجباری، مقدارهای دیگر مطابق `NewTaskInput` |
| `PATCH` | `/api/v1/tasks/:id` | تغییر فیلدهای فرستاده‌شده؛ پاسخ Task نهایی |
| `DELETE` | `/api/v1/tasks/:id` | حذف Task؛ پاسخ `204`، شناسهٔ ناشناخته `404` |
| `GET` | `/api/v1/notifications?recipientName=...` | اعلان‌های گیرنده به ترتیب تازه‌ترین، با زمان و وضعیت پایدار |
| `PATCH` | `/api/v1/notifications/:id/read` | علامت‌گذاری اعلان خوانده‌شده برای همان گیرنده؛ پاسخ `204` |
| `GET` | `/api/v1/tickets/:ticketId/comments` | خواندن کامنت‌های تیکت به ترتیب زمان ثبت |
| `POST` | `/api/v1/tickets/:ticketId/comments` | ثبت کامنت؛ `authorId`, `authorName` و `text` اجباری، آواتار اختیاری؛ زمان را سرور می‌سازد |
| `GET` | `/api/v1/tickets` | تیکت‌های ذخیره‌شده |
| `GET` | `/api/v1/tickets/inbox` | تیکت‌هایی که کاربر جاری ساخته یا به او ارجاع شده‌اند |
| `GET` | `/api/v1/tickets/:ticketId` | خواندن یک تیکت |
| `PUT` | `/api/v1/tickets/:ticketId` | ایجاد یا به‌روزرسانی Ticket؛ عامل و بدنهٔ Ticket ارسال می‌شوند و رویدادهای تغییر سروری ثبت می‌شوند. `projectId` اختیاری است و در صورت ارسال باید به پروژهٔ قابل‌دسترسی کاربر اشاره کند؛ ارجاع‌گیرنده با شناسهٔ کاربر بررسی می‌شود و تغییر ارجاع اعلان می‌سازد |
| `DELETE` | `/api/v1/tickets/:ticketId` | حذف Ticket و Activity وابسته |
| `GET` | `/api/v1/tickets/:ticketId/activity` | Activity قدیمی به جدید |

نمونهٔ ثبت کامنت:

```bash
curl -X POST http://127.0.0.1:4000/api/v1/tickets/TICKET_ID/comments \
  -H 'content-type: application/json' \\
  -d '{"authorId":"u1","authorName":"سارا احمدی","text":"در حال بررسی هستم."}'
```

نمونهٔ ساخت:

```bash
curl -X POST http://127.0.0.1:4000/api/v1/tasks \
  -H 'content-type: application/json' \
  -d '{"projectId":"proj-1","title":"بررسی واقعی API","status":"todo","priority":"medium"}'
```

نمونهٔ ویرایش و حذف:

```bash
curl -X PATCH http://127.0.0.1:4000/api/v1/tasks/TASK_ID \
  -H 'content-type: application/json' \
  -d '{"status":"in-progress"}'
curl -X DELETE http://127.0.0.1:4000/api/v1/tasks/TASK_ID
```

خطاها شکل `{ "error": { "code": "...", "message": "..." } }` دارند. JSON نامعتبر/ورودی نامعتبر `400`، نشست نامعتبر `401`، مسیر ناشناخته `404`، متد نامعتبر `405` و خطای غیرمنتظره `500` است. انتشار عمومی به HTTPS و cookie امن نیاز دارد.

## ۶. مرزهای فرانت‌اند

- `frontend/src/lib/api/backend-client.ts` مسیر هم‌مبدأ `/api/v1`، cookie نشست و خطاهای HTTP را یک‌جا مدیریت می‌کند.
- `auth.ts` ورود و خروج، و `users.ts` هویت واقعی نشست را از API می‌گیرند؛ `src/proxy.ts` هدایت اولیهٔ صفحه‌های محافظت‌شده را انجام می‌دهد.
- `projects.ts` اطلاعات نمایشی پروژه را از fixtureهای فعلی می‌گیرد و Taskهای پروژه را از API می‌خواند.
- `my-tasks.ts` Taskهای پایدار را از API می‌خواند و Overview را در لایهٔ داده محاسبه می‌کند.
- `tasks.ts` عملیات Create/Update را به API می‌فرستد؛ مودال Task از این توابع استفاده می‌کند.
- صفحات سازمان و پروژه هنوز بخشی از شمارنده‌ها/نمودارهای Mock را استفاده می‌کنند؛ این مورد محدودیت شناخته‌شده است.
- Ticketهای موجود در فهرست دمو همچنان fixture هستند، اما بازکردن/ویرایش، Follow/Favorite، حذف، کامنت و Activity جزئیات در API و SQLite پایدار می‌شوند؛ Ticketهای ساخته‌شده نیز در localStorage برای فهرست نمونه نگه داشته می‌شوند.

کامپوننت‌ها نباید URL یا SQL بدانند. `ticket-comments.ts` قرارداد کامنت را برای فیچر tickets فراهم می‌کند؛ هنگام جایگزینی API با بک‌اند دیگر، امضای توابع لایهٔ داده حفظ می‌شود تا UI مجبور به تغییر نشود.

## ۷. Migration و گام بعدی

1. migrationها فایل‌های مرتب‌شده با پیشوند ترتیبی‌اند؛ `schema_migrations` ردیابی می‌کند کدام اجرا شده است. هر migration تازه باید یک‌بار و در transaction اجرا شود. فایل قبلی را پس از اعمال تغییر ندهید. migration `009_ticket_assignment_notifications.sql` constraintهای notifications را برای اعلان ارجاع Ticket و مقصد پروژه‌ای گسترش می‌دهد.
2. قرارداد `/api/v1` و JSON فرانت قرارداد کاربردی است؛ تغییرات ناسازگار باید در `/api/v2` یا با تبدیل سازگار انجام شوند.
3. برای مهاجرت DB، مدل و constraintها را با migrationهای پایگاه مقصد بسازید و repositoryهای Task/Ticket را به adapter آن DB ببرید. هم‌زمان با انتقال Ticketها، `ticket_comments.ticket_id` را به foreign key واقعی تبدیل کنید. کد HTTP و UI به SQL وابسته نیستند.
4. برای بک‌اند سازمانی، ابتدا احراز هویت و مالکیت/مجوز پروژه اضافه شود؛ سپس Organization/User/ProjectMembership و رابطه‌های Task assignee/tag/subtask نرمال شوند. فایل‌های پیوست باید از DB جدا و در storage باشند.
5. `node:sqlite` API همگام دارد و هنوز در شاخهٔ Node 22 در حال توسعه است؛ هم‌زمانی بالا یا استقرار چند نمونه نیاز به driver/ORM پایدار و database server خواهد داشت.

این ساختار مهاجرت را در مرزهای روشن نگه می‌دارد؛ انتقال به PostgreSQL در این فاز به معنی صرفاً عوض‌کردن connection string نیست، چون repository فعلی SQL مستقیم دارد.
