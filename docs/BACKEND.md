# مستند بک‌اند (Backend)

> پیش‌نیاز خواندن: [PRODUCT_OVERVIEW.md](./PRODUCT_OVERVIEW.md).
> این سند نحوه‌ی پیاده‌سازی بک‌اند با **Django + SQLite** را مشخص می‌کند. کد واقعی در پوشه‌ی [`backend/`](../backend/) قرار می‌گیرد.

## ۱. فلسفه‌ی فاز اول

بک‌اند در فاز اول عمداً **ساده و مبتدی** نگه داشته می‌شود:

- بدون میکروسرویس، بدون کش پیچیده، بدون Auth پیشرفته (JWT/OAuth کامل) — یک Session/Token ساده‌ی خود Django کافی است.
- **SQLite** به‌عنوان پایگاه داده (فایل محلی، بدون نیاز به سرور جدا).
- اهمیت داده در این فاز صفر است: می‌توان دیتابیس را هر زمان پاک و از نو Migrate کرد. **آنچه اهمیت دارد ساختار درست مدل‌ها، اپ‌ها و APIهاست**, نه محتوای فعلی داده.
- هدف: خروجی یک API واقعی و قابل‌اتکا برای فرانت (رجوع به [FRONTEND.md](./FRONTEND.md))، با معماری‌ای که مهاجرت به یک سیستم حرفه‌ای‌تر (Postgres، Auth استاندارد، صف/Background Job، Cache) را **بدون بازنویسی اساسی** ممکن کند.

### اصول برای مهاجرت‌پذیری آسان

1. **هرگز از SQL خام استفاده نشود** — همیشه از Django ORM استفاده شود تا سوییچ دیتابیس (مثلاً به PostgreSQL) صرفاً با تغییر `DATABASES` در `settings.py` ممکن باشد.
2. **تنظیمات از طریق متغیر محیطی (Environment Variables)** خوانده شوند (حتی در فاز ساده)، نه Hardcode — تا جابه‌جایی بین محیط‌ها ساده باشد.
3. هر اپ Django باید **مستقل و تک‌مسئولیتی** باشد (یک اپ = یک حوزه‌ی دامنه) تا در آینده بتوان هرکدام را جدا مقیاس داد یا حتی به سرویس مجزا تبدیل کرد.
4. از همان ابتدا **Django REST Framework** استفاده شود (حتی برای فاز ساده) تا ساختار API از اول استاندارد و قابل گسترش باشد، نه Viewهای دستی JsonResponse.

## ۲. ساختار اپ‌ها (Django Apps)

هر اپ متناظر با یک حوزه‌ی دامنه در [PRODUCT_OVERVIEW.md](./PRODUCT_OVERVIEW.md) است:

```
backend/
  config/                 → تنظیمات پروژه (settings, urls, wsgi/asgi)
  apps/
    accounts/             → User، پروفایل، احراز هویت ساده
    organizations/        → Organization، عضویت سازمانی (OrganizationMembership)
    projects/             → Project، Column، ProjectMembership، Attachment سطح پروژه
    tasks/                → Task، Subtask، Tag، Comment، Attachment، TimeEntry (Timer)
    notifications/        → Notification و فیلترهای آن (all/unread/read/approval)
    activity/             → ActivityLog برای نمودارهای فعالیت (Organization/Project/User)
  manage.py
  requirements.txt
  db.sqlite3
```

هر پوشه‌ی اپ باید طبق قانون [AGENTS.md](../AGENTS.md) یک `README.md` داشته باشد که مسئولیت آن اپ و ارتباطش با اپ‌های دیگر را توضیح دهد.

## ۳. مدل داده (Data Model)

مدل‌های زیر برداشتی مستقیم از موجودیت‌های [PRODUCT_OVERVIEW.md](./PRODUCT_OVERVIEW.md) هستند و مبنای اولیه‌ی `models.py` هر اپ خواهند بود. فیلدها حداقلی و قابل گسترش‌اند.

### apps.accounts

- **User** (می‌تواند `AbstractUser` استاندارد جنگو باشد): `username`, `email`, `avatar`, `bio`

### apps.organizations

- **Organization**: `name`, `description`, `created_at`
- **OrganizationMembership**: `organization (FK)`, `user (FK)`, `role`, `joined_at`

### apps.projects

- **Project**: `organization (FK)`, `name`, `description`, `start_date`, `end_date`, `created_at`
- **Column** (وضعیت‌های سفارشی Board): `project (FK)`, `name`, `order`, `is_done_column (bool)`
- **ProjectMembership**: `project (FK)`, `user (FK)` — تعیین اینکه کدام عضو سازمان به این Board دسترسی دارد
- **ProjectAttachment**: `project (FK)`, `file`, `uploaded_by (FK)`, `uploaded_at`

### apps.tasks

- **Task**: `project (FK)`, `column (FK)`, `parent_task (FK, self, nullable)` (برای Sublist/Subtask و ساختار Tree)، `display_id` (مثل `#324`، یکتا در سطح پروژه یا کل سیستم)، `title`, `assignee (FK → User, nullable)`, `priority` (choices: none/low/medium/high/urgent)، `due_date`, `created_at`, `description`
- **Tag**: `project (FK)`, `name`, `color`
- **TaskTag**: جدول واسط چند-به-چند بین Task و Tag
- **Comment**: `task (FK)`, `author (FK)`, `body`, `created_at`
- **TaskAttachment**: `task (FK)`, `file`, `uploaded_by (FK)`, `uploaded_at`
- **TimeEntry** (Start Timer): `task (FK)`, `user (FK)`, `started_at`, `stopped_at`

### apps.notifications

- **Notification**: `recipient (FK → User)`, `verb` (متن رخداد)، `related_task (FK, nullable)`, `related_project (FK, nullable)`, `related_organization (FK, nullable)`, `status` (choices: unread/read)، `requires_approval (bool)`, `created_at`

### apps.activity

- **ActivityLog**: `user (FK)`, `organization (FK, nullable)`, `project (FK, nullable)`, `date`, `count` — مبنای نمودارهای Activity Heatmap (سازمان، پروژه، تسک‌های من).

## ۴. API

- REST ساده با Django REST Framework؛ یک `ViewSet` یا `APIView` استاندارد به‌ازای هر مدل اصلی.
- الگوی مسیر پیشنهادی: `/api/organizations/`, `/api/organizations/<id>/overview/`, `/api/projects/<id>/`, `/api/projects/<id>/overview/`, `/api/projects/<id>/tasks/?view=board|table|tree|timeline|calendar`, `/api/tasks/<id>/`, `/api/my-tasks/`, `/api/notifications/?filter=all|unread|read|approval`.
- Endpointهای `overview` (سازمان/پروژه/تسک‌های من) داده‌های تجمیعی (Project Health، Pie Chart، Activity Heatmap، Deadline Calendar) را آماده و سرو می‌کنند تا منطق تجمیع در فرانت تکرار نشود.
- احراز هویت فاز اول: Session Authentication ساده‌ی خود Django (یا Token ساده‌ی DRF) — کافی برای توسعه؛ ارتقا به یک روش استاندارد‌تر (مثلاً JWT) بدون تغییر مدل داده ممکن است.

## ۵. مسیر مهاجرت به سیستم حرفه‌ای (Migration Path)

وقتی زمان مهاجرت رسید، این تغییرات باید بدون بازطراحی مدل‌ها ممکن باشد:

| از | به |
|---|---|
| SQLite | PostgreSQL (فقط تغییر `DATABASES` در تنظیمات؛ چون فقط از ORM استفاده شده) |
| Session/Token ساده | JWT یا OAuth2 استاندارد |
| ActivityLog محاسبه‌ی همزمان (Sync) | Job/Worker پس‌زمینه (مثل Celery) برای محاسبه‌ی سنگین‌تر نمودارها |
| ذخیره‌ی فایل محلی (Attachment) | Object Storage (S3 یا مشابه) — با تغییر `Storage backend` در جنگو |
| یک پروژه‌ی مونولیتیک Django | امکان جدا کردن هر اپ (`tasks`, `notifications`, ...) به سرویس مستقل، چون از ابتدا مرز دامنه‌ها (App Boundaries) رعایت شده |

هدف این جدول این است که تصمیم‌های امروز (سادگی و SQLite) هزینه‌ی فردا (مهاجرت به سیستم حرفه‌ای) را زیاد نکنند.
