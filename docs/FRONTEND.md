# مستند فرانت‌اند (Frontend)

> پیش‌نیاز خواندن: [PRODUCT_OVERVIEW.md](./PRODUCT_OVERVIEW.md) و [DESIGN.md](./DESIGN.md).
> این سند نحوه‌ی پیاده‌سازی رابط کاربری با **Next.js** را مشخص می‌کند. کد واقعی در پوشه‌ی [`frontend/`](../frontend/) قرار می‌گیرد.

## ۱. تصمیم فاز اول

در فاز اول، **فقط فرانت‌اند به‌طور کامل ساخته می‌شود**. بک‌اند Django (رجوع به [BACKEND.md](./BACKEND.md)) یک API ساده فراهم می‌کند؛ فرانت باید از همان ابتدا در پشت یک لایه‌ی انتزاعی به داده دسترسی داشته باشد (نه فراخوانی مستقیم و پراکنده‌ی fetch در کامپوننت‌ها) تا:

- بتوان بخش‌هایی را ابتدا با داده‌ی Mock ساخت و بعداً بدون تغییر UI به API واقعی وصل کرد.
- مهاجرت بعدی بک‌اند (تغییر مدل داده، افزودن Auth واقعی، ...) حداقل تأثیر را روی کامپوننت‌های UI بگذارد.

## ۲. تکنولوژی

- **Next.js 16** (App Router، Turbopack) + **React 19** + **TypeScript**.
- **Tailwind CSS v4** (پیکربندی CSS-first؛ بدون فایل `tailwind.config.ts` — همه‌چیز در `globals.css` با `@theme`).
- **shadcn/ui** روی پایه‌ی **Base UI** (`@base-ui/react`) با پریست `nova` — کامپوننت‌ها با `npx shadcn@latest add <name>` اضافه می‌شوند و در `src/components/ui/` قرار می‌گیرند.
- **جهت و زبان: RTL / فارسی** — `components.json` با `"rtl": true` مقداردهی شده، `<html lang="fa" dir="rtl">` و `DirectionProvider` (از `src/components/ui/direction.tsx`) در `layout.tsx` تنظیم شده‌اند.
  > این تصمیم (فارسی/RTL) بر اساس زبان مکالمه و اسپک محصول گرفته شده؛ اگر محصول باید چندزبانه/LTR هم باشد باید اینجا و در `layout.tsx` بازنگری شود.
- **فونت: IRANSansX** (فایل‌های محلی woff2، از کاربر دریافت شده، در `public/fonts/iransansx/`). چون فونتی از Google Fonts نیست، با `next/font` لود نمی‌شود — با `@font-face` دستی در `src/styles/fonts.css` (۹ وزن، ۱۰۰ تا ۹۰۰) تعریف شده و روی متغیر `--font-sans` سوار است.
- **آیکون: RemixIcon** (فونت آیکون، از کاربر دریافت شده). فایل فونت در `public/fonts/remixicon.woff2` و CSS آن (کلاس‌های `ri-*`) در `src/styles/remixicon.css` (کپی از `assets/Icons/remixicon.css` با اصلاح مسیر فونت) — از `globals.css` ایمپورت می‌شود. کامپوننت کمکی `src/components/ui/remix-icon.tsx` (`<RemixIcon name="home-line" />`) رندر `<i className="ri-home-line" />` را انجام می‌دهد؛ رنگ از `currentColor` و سایز از `font-size` (کلاس‌های `text-*` تیلویند) گرفته می‌شود.
  > نام دقیق هر آیکون را قبل از استفاده در `assets/Icons/remixicon.css` (یا [remixicon.com](https://remixicon.com)) چک کنید — اسم‌های شبیه به هم لزوماً یک شکل ندارند (مثلاً `ri-bell-line` آیکون «بی‌صدا» است، نه زنگ ساده؛ آیکون درست اعلان‌ها `ri-notification-line` است).
- مدیریت State سرور: یک لایه‌ی fetch متمرکز (client) + کتابخانه‌ی کش/سرور-استیت (مثل React Query) در آینده؛ در فاز اول می‌تواند ساده و دستی باشد. هنوز پیاده نشده — صفحات فعلی فقط UI اسکلتی/Placeholder دارند.
- Drag & Drop برای نمای Board: هنوز انتخاب نشده؛ تصمیم دقیق هنگام پیاده‌سازی نمای Board گرفته می‌شود و همین‌جا ثبت خواهد شد.

## ۳. ساختار مسیرها (Routing)

ناوبری اصلی حول ۴ تب پایین صفحه است (مطابق [PRODUCT_OVERVIEW.md](./PRODUCT_OVERVIEW.md#۳-معماری-اطلاعات-۴-تب-اصلی)):

```
app/
  (tabs)/
    home/                        → تب خانه: لیست Workspace ها
      organizations/[orgId]/     → صفحه‌ی Overview سازمان
      projects/[projectId]/      → صفحه‌ی پروژه
        list/                    → بخش List با ساب-روت برای هر نما
          tree/
          board/
          table/
          timeline/
          calendar/
        overview/                → بخش Overview پروژه
    my-tasks/                    → تب تسک‌های من (همان نماها + Overview شخصی)
    notifications/                → تب اعلان‌ها
    account/                     → تب حساب کاربری
  tasks/new/                     → صفحه‌ی ساخت تسک جدید (مقصد دکمه‌ی شناور + در تب‌های خانه و تسک‌های من)
  tasks/[taskId]/                → صفحه/پنل جزئیات یک تسک (قابل باز شدن از هرکدام از نماها)
```

> ساختار دقیق فولدرهای Next.js (Route Groups، Layout ها و ...) هنگام Scaffold واقعی پروژه در `frontend/` نهایی و در همان‌جا مستند می‌شود (طبق قانون مستندسازی در [AGENTS.md](../AGENTS.md)).

## ۴. نگاشت مفاهیم محصول به کامپوننت‌ها

| مفهوم محصول | کامپوننت/ماژول فرانت پیشنهادی |
|---|---|
| Bottom Tab Bar | `components/navigation/BottomTabBar` |
| دکمه‌ی شناور «تسک جدید» (FAB) | `components/navigation/AddTaskFab` — ساخته شد (در `home` و `my-tasks`) |
| فرم ساخت تسک جدید | `features/tasks/TaskCreateForm` — ساخته شد (`app/tasks/new/page.tsx`) |
| لیست Workspace در خانه | `features/home/WorkspaceList` |
| Organization Overview (اعضا، پروژه‌های فعال، Activity) | `features/organizations/OrganizationOverview` |
| Project Overview (Health، Pie Chart، Deadline Calendar، Member Activity) | `features/projects/ProjectOverview` |
| نماهای Tree/Board/Table/Timeline/Calendar | `features/projects/views/{tree-view, board-view, table-view, timeline-view, calendar-view}` + سوییچر مشترک `features/projects/ViewSwitcher` — ساخته شد؛ محل واقعی زیر `features/projects/` است نه `features/tasks/` (چون از اول در همین‌جا توسعه داده شد) |
| نوار تب اصلی صفحه + صفحه‌های افزودنی (سند/چت) | `features/pages/{SectionTabs, DocumentPage, ChatPage}` — ساخته شد |
| مدیریت ستون‌های Board | `features/projects/ColumnManager` — هنوز ساخته نشده، ستون‌ها فعلاً ثابت‌اند |
| افزودن عضو به پروژه/Board | `features/projects/MemberAccessManager` — هنوز ساخته نشده |
| کارت/فرم تسک (نام، ID، Assignee، Tag، Timer، Description، Attachment، Comment، Priority، Sublist) | `features/tasks/TaskDetail` — هنوز ساخته نشده (هیچ صفحه‌ی جزئیات تسکی وجود ندارد) |
| Attention Required، Task Status Distribution، Project Health، Portfolio Activity در «تسک‌های من» | `features/my-tasks/MyTasksOverview` — ساخته شد (به‌همراه `MyTaskList` برای بخش لیست) |
| فیلتر اعلان‌ها (All/Unread/Read/Approval) | `features/notifications/NotificationList` — ساخته شد |
| تنظیمات و خروج حساب کاربری | `features/account/AccountSettings` — ساخته شد (پروفایل، تنظیمات حساب، سوییچ‌های اعلان، خروج با تایید) |
| ویجت‌های تکرارشونده (Activity Heatmap، Pie/Donut Chart) | `components/charts/{ActivityHeatmap, ActivityBarRow, StatusDonutChart}` — ساخته شد |
| باکس بوردردار مشترک صفحات Overview | `components/layout/{SectionTitle, SectionBox}` + `components/layout/StatTile` (باکس آماری «سلامت») — ساخته شد |
| هدر صفحه‌های اصلی تب‌ها | `components/layout/AppHeader` — ساخته شد (سفید، تمام‌عرض، با بوردر پایین) |

## ۵. لایه‌ی رنگی (Color Tokens)

منبع اصلی حقیقت رنگ‌ها فایل **`src/styles/colors.css`** است (نه فایل‌های تولیدشده‌ی خودکار shadcn). این فایل شامل توکن‌های خام (`--bg`, `--text`, `--brand`, `--success`, `--warning`, `--error`, ...) برای حالت روشن و تیره است؛ سوییچ بین روشن/تیره از طریق `@media (prefers-color-scheme: dark)` **داخل همین فایل** انجام می‌شود — فعلاً سوییچر دستی تم (مثل `next-themes` یا کلاس `.dark`) نداریم.

در `src/app/globals.css`:

1. `colors.css` ایمپورت می‌شود.
2. توکن‌های استاندارد shadcn (`--background`, `--foreground`, `--primary`, `--muted`, `--border`, ...) در بلوک `@theme inline` به توکن‌های خام بالا نگاشت (map) می‌شوند — مثلاً `--color-primary: var(--brand)`.
2.۵. **پس‌زمینه‌ی `body` روی `bg-bg2` است، نه `bg-background`** — دو سطح رنگی داریم: صفحه خاکستری روشن، سطح‌ها (هدر، نوار تب، باکس‌ها، فیلدها) سفید. هر باکس جدیدی که ساخته می‌شود باید `bg-background` بگیرد وگرنه در زمینه گم می‌شود؛ و هر المان شناوری که روی زمینه‌ی خاکستری حالت «انتخاب‌شده» دارد نباید از `bg-bg2` برای آن استفاده کند (چون هم‌رنگ زمینه می‌شود) — رجوع به [DESIGN.md](./DESIGN.md#۲-سیستم-رنگ-color-system).
3. توکن‌های اضافه‌ی خاص این پروژه که در پالت پیش‌فرض shadcn نیستند (`bg2`, `bg3`, `bg4`, `text2`, `text3`, `text4`, `icon`, `icon2`, `icon3`, `brand`, `link`, `success`, `warning`, `overlay`, ...) هم به همان بلوک اضافه شده‌اند تا کلاس‌های Tailwind مثل `text-text2`, `bg-bg2`, `text-brand` در دسترس باشند.
4. `--radius` روی `0.375rem` تنظیم شده (شعاع کوچک و ثابت، مطابق [DESIGN.md](./DESIGN.md#۴-اندازهی-المانها)).

**قانون مهم:** اگر رنگ جدیدی لازم شد، اول به `colors.css` اضافه شود (چون آن فایل منبع طراحی است)، بعد در صورت نیاز در `@theme inline` نگاشت داده شود. رنگ‌های Hardcode (مثل `#B473F4` مستقیم در کامپوننت) ممنوع است — همیشه از طریق کلاس‌های Tailwind متصل به این توکن‌ها استفاده شود.

> رنگ‌های اختصاصی اولویت تسک (Priority: none/low/medium/high/urgent) که در [DESIGN.md](./DESIGN.md#۲-سیستم-رنگ-color-system) پیشنهاد شده‌اند، هنوز در `colors.css` تعریف نشده‌اند — هر وقت کامپوننت تسک ساخته شد باید این توکن‌ها به `colors.css` اضافه و اینجا مستند شوند.

## ۶. لایه‌ی دسترسی به داده (API Client)

- تمام درخواست‌ها به بک‌اند از یک ماژول متمرکز (مثلاً `lib/api/`) عبور می‌کنند؛ کامپوننت‌ها مستقیماً آدرس API را نمی‌دانند.
- تایپ‌های TypeScript مربوط به موجودیت‌ها (Task، Project، Organization، User، Notification) باید با فیلدهای مدل بک‌اند (رجوع به [BACKEND.md](./BACKEND.md#۳-مدل-داده)) هماهنگ نگه داشته شوند.
- آدرس پایه‌ی API از متغیر محیطی خوانده می‌شود تا سوییچ بین Mock/Local/آینده ساده باشد.

## ۷. قانون مستندسازی ماژول‌ها

طبق [AGENTS.md](../AGENTS.md)، هر فیچر جدید که داخل `frontend/` ساخته می‌شود (مثلاً `features/tasks/`) باید یک `README.md` کوتاه داخل همان پوشه داشته باشد که توضیح دهد: این ماژول چه می‌کند، به کدام API/موجودیت‌های بک‌اند وابسته است، و با کدام ماژول‌های دیگر فرانت ارتباط دارد (مثلاً `TaskDetail` توسط `BoardView`، `TableView` و `TreeView` مشترکاً استفاده می‌شود). کامپوننت‌های خیلی کوچک/زیرساختی (مثل `BottomTabBar`) که هنوز به‌اندازه‌ی یک «فیچر» بزرگ نشده‌اند، فعلاً همین‌جا (بخش ۸) مستند می‌شوند؛ وقتی حجمشان زیاد شد به الگوی «پوشه + README.md» منتقل می‌شوند.

## ۸. وضعیت فعلی پیاده‌سازی (Implementation Status)

> این بخش با هر تغییر واقعی در کد به‌روزرسانی می‌شود؛ فهرست کامل نیست، فقط چیزی را که واقعاً ساخته شده ثبت می‌کند.

پروژه Next.js با `create-next-app` (TypeScript + Tailwind v4 + App Router + `src/`) در `frontend/` ساخته شده و shadcn/ui (Base UI، پریست Nova، RTL) روی آن Init شده است.

**کامپوننت‌های نصب‌شده از shadcn** (`src/components/ui/`):

| کامپوننت | دلیل نصب اولیه |
|---|---|
| `button` | دکمه‌ی Ghost/Primary در سراسر اپ (سایز پیش‌فرض ۳۲px، `lg` معادل ۳۶px — مطابق [DESIGN.md](./DESIGN.md#۵-الگوی-دکمهها)) |
| `tabs` | سوییچ List/Overview در صفحه‌ی پروژه (`src/app/(tabs)/home/projects/[id]/page.tsx`) استفاده شده؛ فیلتر All/Unread/Read/Approval در اعلان‌ها هنوز نه |
| `avatar` | نمایش اعضا در `OrganizationOverview` استفاده شده (فعلاً فقط `AvatarFallback` با حرف اول اسم، بدون عکس واقعی) |
| `badge` | برچسب/وضعیت/اولویت — فعلاً فقط برای نشانه‌ی «این بخش هنوز ساخته نشده» در صفحات Placeholder استفاده شده |
| `separator` | جداکننده‌ی ظریف بین بخش‌ها — هنوز در UI استفاده نشده |
| `direction` | `DirectionProvider`/`useDirection` برای پشتیبانی RTL |
| `dialog` | `MembersDialog` (مودال مدیریت اعضای سازمان) |
| `dropdown-menu` | منوی سه‌نقطه‌ی `PageHeader` و منوی سه‌نقطه‌ی هر ردیف عضو در `MembersDialog` |
| `switch` | تاگل «فقط ادمین‌ها می‌توانند عضو جدید اضافه کنند» در `MembersDialog` |

هر وقت کامپوننت جدیدی از shadcn اضافه شود، همین جدول به‌روزرسانی می‌شود.

**ساختار مسیر پیاده‌سازی‌شده:**

```
src/app/
  layout.tsx          → html[lang=fa][dir=rtl] + DirectionProvider (فونت IRANSansX از fonts.css، نه next/font)
  page.tsx             → ریدایرکت به /home
  (tabs)/
    layout.tsx          → رندر children + BottomTabBar ثابت در پایین صفحه
    home/page.tsx        → getOrganizations() + WorkspaceList
    my-tasks/page.tsx    → Placeholder
    notifications/page.tsx → getNotifications() + NotificationList
    account/page.tsx     → Placeholder (شامل دکمه‌ی خروج، Ghost/destructive)
src/components/
  navigation/bottom-tab-bar.tsx → ناوبری ۴ تب پایین صفحه (Client Component، بر اساس pathname تب فعال را با رنگ brand مشخص می‌کند)
  navigation/page-header.tsx    → PageHeader مشترک صفحات جزئیات (بازگشت + عنوان + منوی سه‌نقطه) — رجوع به src/components/navigation/README.md
  layout/section.tsx            → SectionTitle + SectionBox (باکس بوردر+پدینگ‌۱۲px مشترک همه‌ی Overview ها)
```

**صفحه‌ی خانه، سازمان، پروژه و اعلان‌ها ساخته شده‌اند:**

```
src/lib/api/
  types.ts          → Member, ProjectRef, Task, Project, Organization, Notification (تایپ‌های مشترک همه‌ی این صفحات)
  mock-data.ts       → MOCK_ORGANIZATIONS + MOCK_PROJECTS + MOCK_NOTIFICATIONS (منبع واحد Mock — شناسه‌ها هماهنگ‌اند)
  organizations.ts   → getOrganizations(), getOrganization(id)
  projects.ts         → getProject(id)
  notifications.ts    → getNotifications()
  users.ts            → getCurrentUser() (کاربر واردشده؛ تایپ CurrentUser + NotificationPreferences در types.ts)
  my-tasks.ts         → getMyTasks() (فقط «در حال انجام»)، getMyTasksOverview() (همه‌ی وضعیت‌ها)
  calendar.ts         → getToday() (تاریخ «امروز» از لایه‌ی داده می‌آید، نه new Date())
  tasks.ts            → getTaskFormOptions() (پروژه‌ها + اعضای سازمانشان برای سلکت‌های فرم)، createTask() (فعلاً no-op)
src/components/charts/
  activity-heatmap.tsx    → ActivityHeatmap (گرید فعالیت شبیه گیت‌هاب — پروژه، بعداً تسک‌های من)
  activity-bar-row.tsx    → ActivityBarRow (ردیف تک‌خطی با مستطیل‌های عمودی — فعالیت هر عضو در صفحه‌ی سازمان)
  status-donut-chart.tsx  → StatusDonutChart (چارت دایره‌ای SVG بدون کتابخانه‌ی خارجی)
src/features/home/
  workspace-list.tsx → WorkspaceList: آکوردئون سازمان‌ها؛ هر سازمان یک ردیف با نام (لینک) + شورون باز/بسته (سمت چپ)؛
                        وقتی باز است پروژه‌هایش تورفته زیرش لیست می‌شوند و یک آیکون + برای افزودن پروژه‌ی جدید
                        (فقط state محلی، غیرماندگار) کنار شورون ظاهر می‌شود. بدون آیکون نوع (طبق بازخورد کاربر حذف شد).
src/features/organizations/
  organization-overview.tsx → OrganizationOverview: اعضا (فقط اواتار روی‌هم‌افتاده)، پروژه‌های فعال (SectionBox)،
                                فعالیت اعضا (SectionBox، هر عضو یک ردیف با ActivityBarRow)
  members-dialog.tsx         → MembersDialog: مودال مدیریت اعضا (تاگل دسترسی دعوت، افزودن عضو، تغییر نقش/حذف — همه محلی)
src/features/projects/
  task-display.tsx        → ثابت‌ها/کامپوننت مشترک نماها: PRIORITY_LABEL/COLOR، STATUS_LABEL، STATUS_COLUMNS، PriorityDot
  project-task-list.tsx    → ProjectTaskList (Client): سوییچر ۵ نما — همه‌ی ۵ تا واقعاً پیاده شده‌اند (زیر)
  views/table-view.tsx      → TableView: جدول واقعی با هدر ستون و بوردر بین همه‌ی سلول‌ها
  views/tree-view.tsx        → TreeView: باز/بسته کردن زیر-تسک‌ها (task.subtasks)
  views/board-view.tsx       → BoardView: کانبان با Drag & Drop واقعی (@dnd-kit) بین ۳ ستون ثابت (وضعیت تسک)
  view-switcher.tsx         → TASK_VIEWS + ViewSwitcher: نوار سوییچ ۵ نما (آیکون + متن، با بوردر زیرین) — مشترک بین ProjectTaskList و MyTaskList
  views/timeline-view.tsx    → TimelineView: ساید‌بار جمع‌شونده‌ی تسک‌ها + تقویم افقی اسکرول‌شونده (مقیاس روزانه/هفتگی/ماهانه، دکمه‌ی «امروز»)
  views/calendar-view.tsx    → CalendarView: تقویم ماهانه با پیمایش بین ماه‌های دارای تسک
  project-overview.tsx      → ProjectOverview: بازه‌ی زمانی + دکمه‌ی افزودن پیوست (غیرفعال)، «سلامت پروژه» (SectionBox، ۴ باکس آماری)،
                               پراکندگی وضعیت تسک‌ها (SectionBox + StatusDonutChart)، تقویم سررسیدها (SectionBox، Placeholder ساده)،
                               فعالیت اعضا (SectionBox + ActivityHeatmap)
src/features/pages/
  section-tabs.tsx      → SectionTabs (Client): نوار تب اصلی (لیست/نمای‌کلی + صفحه‌های افزوده‌شده + دکمه‌ی +)
  document-page.tsx      → DocumentPage: صفحه‌ی خالی نوشتن متن
  chat-page.tsx          → ChatPage: صفحه‌ی چت (state محلی، بدون بلادرنگ)
src/features/tasks/
  task-create-form.tsx  → TaskCreateForm (Client): فرم ساخت تسک جدید (عنوان، پروژه، مسئول، سررسید،
                           اولویت، برچسب، توضیحات) — ذخیره فقط شبیه‌سازی است و به صفحه‌ی قبل برمی‌گردد
src/features/my-tasks/
  my-task-list.tsx      → MyTaskList (Client): فیلتر پروژه + همان ۵ نمای صفحه‌ی پروژه (ری‌یوز مستقیم، بدون کپی)
  my-tasks-overview.tsx  → MyTasksOverview: پروفایل + پیوست‌ها، نیازمند رسیدگی، پراکندگی وضعیت،
                            سلامت تجمیعی پروژه‌ها، فعالیت شخصی (Portfolio Activity)
src/features/account/
  account-settings.tsx → AccountSettings (Client): پروفایل (اواتار/نام/ایمیل/توضیحات + دکمه‌ی ویرایش)، گروه «حساب»،
                          سوییچ‌های «اعلان‌ها»، گروه «درباره»، و خروج با دیالوگ تایید
  profile-dialog.tsx    → ProfileDialog: مودال ویرایش نام/ایمیل/توضیحات (state در والد، بدون API)
  settings-row.tsx      → SettingsGroup / SettingsLinkRow / SettingsToggleRow (ردیف‌های تکرارشونده‌ی تنظیمات)
src/features/notifications/
  notification-list.tsx → NotificationList (Client): فیلتر همه/خوانده‌نشده/خوانده‌شده/تایید با Tabs کنترل‌شده؛
                            کلیک روی ردیف = خواندن + هدایت به مقصد؛ دکمه‌های تایید/رد برای اعلان‌های requiresApproval
src/app/(tabs)/
  home/page.tsx                     → getOrganizations() + WorkspaceList
  home/organizations/[id]/page.tsx  → getOrganization(id) + PageHeader + OrganizationOverview؛ اگر id نامعتبر بود پیام «پیدا نشد»
  home/projects/[id]/page.tsx       → getProject(id) + PageHeader + Tabs شادکن (لیست/نمای‌کلی) → ProjectTaskList / ProjectOverview
  notifications/page.tsx            → getNotifications() + NotificationList
  account/page.tsx                  → getCurrentUser() + AccountSettings
  my-tasks/page.tsx                 → getCurrentUser() + getMyTasks/Range/Overview + Tabs (لیست/نمای‌کلی)
src/app/tasks/new/page.tsx          → getTaskFormOptions() + PageHeader + TaskCreateForm (خارج از (tabs)، بدون Bottom Tab Bar)
```

نکات مهم برای ادامه‌ی کار:

- **هدرها بیرون از کانتینر `p-4` صفحه رندر می‌شوند**: `AppHeader` و `PageHeader` تمام‌عرض و سفیدند، پس ساختار هر صفحه به شکل «هدر + یک `div` با `p-4` برای محتوا» است، نه یک کانتینر `p-4` دور همه‌چیز. در صفحه‌ی پروژه و تسک‌های من، `SectionTabs` هم بیرون از پدینگ می‌نشیند (نوار تب تمام‌عرض، پدینگ داخل پنل‌ها).
- **`TimelineView` عمداً دو جهت دارد**: ساید‌بار تسک‌ها در جریان RTL صفحه می‌ماند، اما ناحیه‌ی تقویم `dir="ltr"` است تا تاریخ از چپ به راست جلو برود و `scrollLeft` رفتار استاندارد داشته باشد. هدر تاریخ داخل همان کانتینر اسکرول است تا با تقویم هم‌زمان حرکت کند؛ ارتفاع ردیف‌های ساید‌بار (`h-9`) و ردیف خالی زیر عنوان آن (`h-7`) باید دقیقاً با دو ردیف هدر تقویم یکی بماند وگرنه ردیف‌ها از تراز خارج می‌شوند.
- **`AddTaskFab` با کلاس‌های منطقی (`start-4`) جای‌گذاری شده**، نه `right-4` — چون کل اپ RTL است و `start` همان سمت راست است؛ اگر روزی LTR اضافه شد، دکمه خودبه‌خود به سمت درست می‌رود. ارتفاع `bottom` هم باید بالاتر از `h-14` نوار تب‌ها بماند.
- **همه‌ی محاسبه‌های تاریخ در `src/lib/jalali.ts` متمرکز است** (`parseDate`, `formatDate`, `toOrdinal`/`fromOrdinal`, `addDays`, `startOfWeek`, `daysInMonth`, `MONTH_NAMES`, `isBefore`). این تقویم **واقعی نیست**: کبیسه ندارد (اسفند همیشه ۲۹ روز، هر سال ۳۶۵ روز) و `weekdayIndex` یک قرارداد داخلی است نه روزِ هفته‌ی واقعی — فقط برای ترتیب، فاصله و چیدمان نسبی معتبر است. `TimelineView` و `CalendarView` هر دو از همین ماژول استفاده می‌کنند (قبلاً هرکدام نسخه‌ی خودشان را داشتند).
- **«امروز» یک ثابت Mock است** (`MOCK_TODAY` در `mock-data.ts`)، نه تاریخ سیستم — چون تاریخ‌های داده جلالی و دستی‌اند و مقایسه با تاریخ واقعی نتیجه‌ی بی‌معنا می‌دهد.
- **تخصیص تسک به کاربر با مقایسه‌ی نام انجام می‌شود** چون `Task` هنوز `assigneeId` ندارد؛ با آمدن بک‌اند باید به شناسه تغییر کند.
- **تاریخ‌ها با رقم لاتین ذخیره می‌شوند** (`"1404/05/10"`)، نه رقم فارسی — چون `Number("۱۰")` در جاوااسکریپت `NaN` می‌دهد و منطق تقویم/Timeline را می‌شکند. اگر جایی نیاز به نمایش رقم فارسی بود، باید در لحظه‌ی نمایش فرمت شود، نه در لایه‌ی داده.
- **فرمول `mockActivity` در `mock-data.ts` باید ضریب‌های غیرمضرب‌ ۵ روی هر دو پارامتر (index و seed) داشته باشد** — نسخه‌ی اول (`(i*seed+seed)%5`) وقتی seed مضرب ۵ بود (مثلاً ۵) همیشه صفر می‌داد و کل ردیف فعالیت آن عضو طوسی/خالی نشان داده می‌شد. اگر seed جدیدی اضافه می‌کنید حواستان به این تله باشد.
- **`Timeline`/`Calendar` تاریخ‌ها را با یک تبدیل خطی ساده‌ی خودشان مقایسه می‌کنند** (نه تقویم جلالی واقعی با کبیسه/طول ماه دقیق) — کافی برای موقعیت نسبی، نه برای محاسبه‌ی تقویمی دقیق.
- رنگ اولویت «بالا» فعلاً از `--error` استفاده می‌کند چون توکن اختصاصی‌اش هنوز در `colors.css` نیست (رجوع به بخش ۵).
- صفحه‌های افزوده‌شده با دکمه‌ی «+» (سند/چت)، متن سند و پیام‌های چت هم فقط در state مرورگرند و با رفرش پاک می‌شوند؛ چت اتصال بلادرنگ ندارد.
- افزودن پروژه از آکوردئون خانه، افزودن/حذف/تغییر نقش عضو در `MembersDialog`، تغییر وضعیت تسک در `BoardView`، خواندن/تایید در `NotificationList`، و ویرایش پروفایل/سوییچ‌های اعلان در `AccountSettings` — همه فقط در state مرورگر است و با رفرش از بین می‌رود؛ هیچ‌کدام API واقعی ندارند.
- **هنوز Auth واقعی وجود ندارد**: `getCurrentUser()` یک کاربر ثابت (`u1`، سارا احمدی از `org-1`) برمی‌گرداند و دکمه‌ی «خروج» در `AccountSettings` فقط دیالوگ تایید را می‌بندد. تب «تسک‌های من» هم وقتی ساخته شد باید از همین `getCurrentUser()` استفاده کند، نه یک منبع کاربرِ موازی.
- ردیف‌های تنظیمات حساب که هنوز صفحه‌ی مقصد ندارند (تغییر ایمیل/رمز، زبان، ظاهر، راهنما، حریم خصوصی) عمداً غیرفعال و بدون فلش رندر می‌شوند تا کلیک‌پذیر به‌نظر نرسند. «ظاهر» هم به همین دلیل سوییچ نیست (تم فقط با `prefers-color-scheme` عوض می‌شود — بخش ۵).
- منوی سه‌نقطه‌ی `PageHeader` (افزودن تسک/مایل‌استون/بخش، تنظیمات، حذف) فعلاً فقط UI است؛ آیتم‌ها `onClick` ندارند چون صفحه/فرم مقصدشان هنوز ساخته نشده.
- **تنها کتابخانه‌ی خارجی UI پروژه تا این لحظه `@dnd-kit` است** (`@dnd-kit/core` + `@dnd-kit/utilities`)، فقط در `views/board-view.tsx` — برای Drag & Drop واقعی روی موبایل/ماوس. تست کامل ژست Drag روی دستگاه واقعی توصیه می‌شود؛ ابزارهای خودکار مرورگر گاهی رویداد Pointer را درست شبیه‌سازی نمی‌کنند.

برای اجرای محلی: `.claude/launch.json` در ریشه‌ی پروژه یک سرور به نام `quire-frontend` تعریف کرده (`npm --prefix frontend run dev`، پورت پیش‌فرض ۳۰۰۰ با `autoPort`). اگر بعد از چند بار ادیت پیاپی فایل‌ها خطاهای عجیب/قدیمی در کنسول مرورگر دیدید (مثل ارجاع به فایلی که قبلاً rename شده)، احتمالاً کش Turbopack کهنه شده — سرور را متوقف کنید، `frontend/.next` را پاک کنید، و دوباره اجرا کنید.
