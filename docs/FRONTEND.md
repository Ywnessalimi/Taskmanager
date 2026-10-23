# مستند فرانت‌اند (Frontend)

> پیش‌نیاز خواندن: [PRODUCT_OVERVIEW.md](./PRODUCT_OVERVIEW.md) و [DESIGN.md](./DESIGN.md).
> این سند نحوه‌ی پیاده‌سازی رابط کاربری با **Next.js** را مشخص می‌کند. کد واقعی در پوشه‌ی [`frontend/`](../frontend/) قرار می‌گیرد.

## ۱. تصمیم فاز اول

در فاز فعلی، رابط Next.js از API محلی Node.js + SQLite برای Taskهای پروژه استفاده می‌کند (رجوع به [BACKEND.md](./BACKEND.md)). سایر بخش‌ها می‌توانند تا زمان اتصال API خودشان Mock یا محلی بمانند. فراخوانی API از لایه‌ی متمرکز `lib/api/` عبور می‌کند تا:

- بتوان بخش‌هایی را ابتدا با داده‌ی Mock ساخت و بعداً بدون تغییر UI به API واقعی وصل کرد.
- مهاجرت بعدی بک‌اند (تغییر مدل داده، افزودن Auth واقعی، ...) حداقل تأثیر را روی کامپوننت‌های UI بگذارد.

## ۲. تکنولوژی

- **Next.js 16** (App Router، Turbopack) + **React 19** + **TypeScript**.
- **Tailwind CSS v4** (پیکربندی CSS-first؛ بدون فایل `tailwind.config.ts` — همه‌چیز در `globals.css` با `@theme`).
- **shadcn/ui** روی پایه‌ی **Base UI** (`@base-ui/react`) با پریست `nova` — کامپوننت‌ها با `npx shadcn@latest add <name>` اضافه می‌شوند و در `src/components/ui/` قرار می‌گیرند.
- **جهت و زبان: فارسی (RTL) پیش‌فرض، انگلیسی (LTR) هم پشتیبانی می‌شود** — `<html lang dir>` و `DirectionProvider` (از `src/components/ui/direction.tsx`) بر اساس زبان جاری در `layout.tsx` (Server Component) تنظیم می‌شوند، نه ثابت. `components.json` هنوز `"rtl": true` دارد چون RTL پیش‌فرض/غالب پروژه است. جزئیات کامل در بخش ۹ («زبان و ظاهر»).
- **فونت: IRANSansX** (فایل‌های محلی woff2، از کاربر دریافت شده، در `public/fonts/iransansx/`). چون فونتی از Google Fonts نیست، با `next/font` لود نمی‌شود — با `@font-face` دستی در `src/styles/fonts.css` (۹ وزن، ۱۰۰ تا ۹۰۰) تعریف شده و روی متغیر `--font-sans` سوار است.
- **آیکون: RemixIcon** (فونت آیکون، از کاربر دریافت شده). فایل فونت در `public/fonts/remixicon.woff2` و CSS آن (کلاس‌های `ri-*`) در `src/styles/remixicon.css` (کپی از `assets/Icons/remixicon.css` با اصلاح مسیر فونت) — از `globals.css` ایمپورت می‌شود. کامپوننت کمکی `src/components/ui/remix-icon.tsx` (`<RemixIcon name="home-line" />`) رندر `<i className="ri-home-line" />` را انجام می‌دهد؛ رنگ از `currentColor` و سایز از `font-size` (کلاس‌های `text-*` تیلویند) گرفته می‌شود.
  > نام دقیق هر آیکون را قبل از استفاده در `assets/Icons/remixicon.css` (یا [remixicon.com](https://remixicon.com)) چک کنید — اسم‌های شبیه به هم لزوماً یک شکل ندارند (مثلاً `ri-bell-line` آیکون «بی‌صدا» است، نه زنگ ساده؛ آیکون درست اعلان‌ها `ri-notification-line` است).
- مدیریت State سرور: یک لایه‌ی fetch متمرکز (client) + کتابخانه‌ی کش/سرور-استیت (مثل React Query) در آینده؛ در فاز اول می‌تواند ساده و دستی باشد. هنوز پیاده نشده — صفحات فعلی فقط UI اسکلتی/Placeholder دارند.
- Drag & Drop برای نمای Board: هنوز انتخاب نشده؛ تصمیم دقیق هنگام پیاده‌سازی نمای Board گرفته می‌شود و همین‌جا ثبت خواهد شد.

## ۳. ساختار مسیرها (Routing)

در جریان فعلی محیط مستقل پروژه‌ها، `/projects` درخت شرکت ← معاونت ← پروژه را نشان می‌دهد؛ ردیف‌های شرکت و معاونت باز/بسته می‌شوند و پروژه‌های مجاز به صفحهٔ همان پروژه می‌روند. `ProjectRef.memberIds` منبع مجازبودن در دادهٔ نمونه است و لایهٔ `lib/api` پیش از تحویل داده به صفحه یا navigator پروژه‌های غیرمجاز را حذف می‌کند؛ route پروژه نیز دسترسی را دوباره بررسی می‌کند.

**به‌روزرسانی ناوبری و ورود:** `/` به `/login` می‌رود و مسیرهای برنامه فقط با نشست معتبر قابل مشاهده‌اند؛ `/signup` به ورود برمی‌گردد. پس از ورود، کارتابل `/inbox` صفحهٔ شروع است. `/projects` ورودی محیط مستقل پروژه‌هاست؛ `/home/projects/[id]` صفحهٔ پروژه و `/home/projects/MyTasks` صفحهٔ تجمیعی تسک‌های کاربر است. مینی‌بار مشترک در موبایل پایین و در دسکتاپ سمت شروع (`start`) نمایش داده می‌شود؛ RTL/LTR با `dir` ریشه جابه‌جا می‌شود.

در صفحهٔ ورود دسکتاپ، ترتیب پنل فرم بر اساس locale صریح است: فارسی فرم را در راست و Hero را در چپ قرار می‌دهد؛ انگلیسی ترتیب LTR، یعنی Hero چپ و فرم راست، را نگه می‌دارد. سطح فرم کل عرض و ارتفاع ستون ۴۰۰px را پر می‌کند و محتوای آن عمودی وسط‌چین است. محتوای برد دکوراتیو Hero در پایین قاب قرار می‌گیرد و ۲۴px از لبهٔ پایین عبور می‌کند.

تنظیمات هر سازمان در `/home/organizations/[id]/settings` با چهار بخش General، Members، Properties و Options نمایش داده می‌شود. تصویر سازمان از file input انتخاب و به API فرستاده می‌شود؛ فیلدهای عمومی شامل نام، توضیحات و slug هستند. نقش سفارشی به `/home/organizations/[id]/settings/permissions/[memberId]` می‌رود و مجوزها را با چک‌باکس و API ذخیره می‌کند. نقش مدیر فقط مدیریت دسترسی اعضا را مجاز می‌کند. `MembersDialog` در Overview همان APIهای سازمان را برای دعوت به ایمیل و تغییر نقش‌های پایه مصرف می‌کند. نام/توضیحات در Overview و درخت نمایش داده می‌شوند و مسیرهای خوانا `/o/[organizationSlug]` و `/o/[organizationSlug]/[projectSlug]` به Overview و پروژه می‌روند؛ مسیرهای شناسه‌محور سازگار باقی می‌مانند. Options شامل Email to Quire، Notifications و Features در یک صفحه است و ناوبری فرعی به هر بخش اسکرول می‌کند.

جزئیات سازمان و معاونت در مسیرهای خوانا با parallel route `@modal` هنگام ناوبری درون‌برنامه‌ای در مودال `taskWorkspace` روی مسیر قبلی می‌آیند؛ مسیرهای مستقیم نسخهٔ مستقل خود را نگه می‌دارند. انتخاب معاونت از درخت با `divisionId` همان قاب جزئیات سازمان را با آن معاونت باز می‌کند. مسیر خوانای پروژه `/o/[organizationSlug]/[projectSlug]` صفحهٔ مستقل است؛ مسیر شناسه‌محور `/home/projects/[id]` در ناوبری نرم از `@modal` به شکل مودال جزئیات پروژه باز می‌شود. wrapper مشترک `components/ui/workspace-route-modal.tsx` مسئول اندازه، overlay، بستن و رفتار تمام‌صفحه در موبایل است.

صفحهٔ پروژه و `/home/projects/MyTasks` از `features/projects/project-section-tabs.tsx` برای یک نوار یکپارچه مطابق Figma node `1710:27099` استفاده می‌کنند: Dashboard، Board، List (Tree)، Calendar، Gantt و «افزودن» صفحهٔ سفارشی. محتوای Dashboard در صفحهٔ MyTasks، Overview شخصی و در پروژه، Overview همان پروژه است؛ نماهای MyTasks همهٔ تسک‌های تخصیص‌یافته را از همهٔ پروژه‌ها و همهٔ وضعیت‌ها می‌گیرند. فقط Board این صفحه تیکت‌های بدون پروژه را از ماژول tickets می‌گیرد؛ عنوان تیکت خواندنی است و وضعیتش با جابه‌جایی کارت تغییر می‌کند، آواتار سازنده و در صورت ارجاع آواتار تنها ارجاع‌گیرنده نمایش داده می‌شود و ارجاع از منوی کارت قابل تغییر است. آواتارها در سمت راست کارت کمی روی هم می‌افتند. وضعیت تیکت با `TaskStatus` مشترک است؛ ارجاع و اتصال تیکت به تسک در localStorage نمونه‌سازی می‌شوند. هنگام کشیدن تیکت به کارت، تیکت‌های پیوندخورده باقی می‌مانند و جایگاه خاکستری در محل درج نشان داده می‌شود؛ رهاکردن بین تیکت‌ها ترتیب محلی آن‌ها را هم ثبت می‌کند. در `ProjectNavigator`، پیوند «تسک‌های من» بالای فهرست پروژه‌ها با ۱۶px پدینگ عمودی قرار دارد. SVGهای نوار پروژه در `public/images/figma/project-tabs/` ذخیره می‌شوند؛ محتوا و رفتار نماهای غیربرد تغییر نمی‌کند. `DesktopHeader` در همهٔ مسیرها طرح node `1710:27098` را نشان می‌دهد؛ عنوان از مسیر می‌آید و در صفحهٔ پروژه، نام پروژه از گزینه‌های واکشی‌شده در layout پیدا می‌شود و منوی انتخاب پروژه دارد. خوشهٔ سمت پایان به ترتیب «جدید»، جداکننده، جست‌وجو، اعلان و آواتار است. SVGهای این هدر در `public/images/figma/project-header/` ذخیره شده‌اند. نشان ستون Board از node `1710:27237` پیروی می‌کند؛ تعریف ستون‌های دلخواه و جایگاه تسک در آن‌ها در localStorage ذخیره می‌شود. Board MyTasks ستون‌های دلخواه پروژه‌های فهرست تسک‌ها را با نام پروژه جمع می‌کند و جابه‌جایی تسک به ستون پروژه‌ای دیگر را رد می‌کند.

رنگ‌های طرح جدید در `src/styles/colors.css` با پیشوندهای `--mini-bar-*` و `--project-*` تعریف شده‌اند؛ هیچ مؤلفهٔ محیط پروژه رنگ خام طرح را تکرار نمی‌کند. دارایی عکس مینی‌بار در `public/images/figma/minibar-profile.png` قرار دارد.

ناوبری اصلی حول ۴ تب پایین صفحه است (مطابق [PRODUCT_OVERVIEW.md](./PRODUCT_OVERVIEW.md#۳-معماری-اطلاعات-۴-تب-اصلی)):

```
app/
  (tabs)/
    home/                        → تب خانه: خوش‌آمدگویی + تعداد تسک‌های در حال انجام + لیست Workspace ها
      organizations/[orgId]/     → صفحه‌ی Overview سازمان
      projects/MyTasks/          → تسک‌های کاربر در پوستهٔ صفحهٔ پروژه؛ از همهٔ پروژه‌ها
      projects/[projectId]/      → صفحه‌ی پروژه
        list/                    → بخش List با ساب-روت برای هر نما
          tree/
          board/
          table/
          timeline/
          calendar/
        overview/                → بخش Overview پروژه
    notifications/                → تب اعلان‌ها
    account/                     → تب حساب کاربری
  tasks/new/                     → صفحه‌ی ساخت تسک جدید (مقصد دکمه‌ی شناور + در تب‌های خانه و تسک‌های من)
  tasks/[taskId]/                → صفحه/پنل جزئیات یک تسک (قابل باز شدن از هرکدام از نماها)
  users/[userId]/                → پروفایل عمومی یک کاربر (مقصد کلیک روی نام عامل رخداد در اعلان‌ها) — ساخته شد
```

> ساختار دقیق فولدرهای Next.js (Route Groups، Layout ها و ...) هنگام Scaffold واقعی پروژه در `frontend/` نهایی و در همان‌جا مستند می‌شود (طبق قانون مستندسازی در [AGENTS.md](../AGENTS.md)).

## ۴. نگاشت مفاهیم محصول به کامپوننت‌ها

جریان جدید هدر: `features/tasks/new-task-button.tsx` منوی Figma `1722:28239` را باز می‌کند و `features/tasks/new-task-dialog.tsx` مودال ساخت `1722:29819` را در Portal رندر می‌کند. این مودال از `TaskPanel` مستقل است؛ پنل جزئیات و ورودی‌های قبلی ساخت تسک همچنان مصرف‌کنندگان خود را دارند. گزینه‌های پروژه از layout و کاربر جاری از `DesktopHeader` می‌آیند. SVGهای دو طرح در `public/images/figma/new-task/` ذخیره می‌شوند. `DialogContent` واریانت `taskWorkspace` برای قاب ۱۶px و عرض حداکثر ۱۰۷۲px دارد.

| مفهوم محصول | کامپوننت/ماژول فرانت پیشنهادی |
|---|---|
| Bottom Tab Bar | `components/navigation/BottomTabBar` |
| ناوبری کناری دسکتاپ (`lg` به بالا) | `components/navigation/SidebarNav` — ساخته شد (رجوع به [DESIGN.md](./DESIGN.md#۸۱-نسخهی-دسکتاپ-نسخهی-اولیه)) |
| هدر مستقل بالای محتوای دسکتاپ (اواتار، اعلان‌ها، جستجو، تسک جدید) | `components/navigation/DesktopHeader` — ساخته شد، طرح Figma «Header»؛ جدا از SidebarNav |
| دکمه‌ی شناور «تسک جدید» (FAB) | `components/navigation/AddTaskFab` — ساخته شد (در `home` و `my-tasks`) |
| فرم ساخت تسک جدید | `features/tasks/{TaskForm, TaskCreateForm}` — ساخته شد (`app/tasks/new/page.tsx` و مودال مشترک) |
| پنل جزئیات/ویرایش تسک | `features/tasks/{TaskPanel, TaskDetailForm}` + `components/providers/TaskPanelProvider` — ساخته شد (از `TreeView` باز می‌شود) |
| پروفایل عمومی کاربر | `features/users/UserProfile` — ساخته شد (`app/users/[id]/page.tsx`) |
| هدر خوش‌آمدگویی + تعداد تسک‌های در حال انجام در خانه | `features/home/HomeGreeting` — ساخته شد، طرح Figma «Home» |
| لیست Workspace در خانه (با درصد پیشرفت هر پروژه) | `features/home/WorkspaceList` |
| Organization Overview (جزئیات سازمان، اعضا، معاونت‌ها/پروژه‌ها، آخرین فعالیت‌ها و کامنت) | `features/organizations/OrganizationOverview`, `organization-activity-feed.tsx` — قاب workspace با پنل فعالیت تمام‌قد و بارگذاری ۱۵تایی هنگام پیمایش |
| Project Overview (Health، Pie Chart، Deadline Calendar، Member Activity) | `features/projects/ProjectOverview` |
| نماهای Board/Tree/Calendar/Timeline | `features/projects/views/{board-view, tree-view, calendar-view, timeline-view}`؛ صفحهٔ پروژه و `/home/projects/MyTasks` با `ProjectSectionTabs` بین نماها جابه‌جا می‌شوند. نمای Table در کد باقی است اما در این نوار تب فعال نیست |
| نوار تب و صفحه‌های افزودنی (سند/چت) | `features/projects/ProjectSectionTabs` برای پروژه و MyTasks؛ `features/pages/{DocumentPage, ChatPage}` برای محتوای سند/چت |
| مدیریت ستون‌های Board | `features/projects/ColumnManager` — هنوز ساخته نشده، ستون‌ها فعلاً ثابت‌اند |
| افزودن عضو به پروژه/Board | `features/projects/MemberAccessManager` — هنوز ساخته نشده |
| کارت/فرم تسک (نام، ID، Assignee، Tag، Timer، Description، Priority، Sublist) + دنبال‌کننده/علاقه‌مندی/زمان صرف‌شده/لاگ فعالیت/تاریخ+تکرار | `features/tasks/TaskForm` (حالت ویرایش) به‌همراه زیرکامپوننت‌های `task-detail-header`, `followers-dialog`, `time-tracking`, `activity-log`, `date-edit-dialog`, `tag-picker-dialog` — رجوع به [features/tasks/README.md](../frontend/src/features/tasks/README.md). Attachment/Comment هنوز ساخته نشده. |
| Attention Required، Task Status Distribution، Project Health، Portfolio Activity در «تسک‌های من» | `features/my-tasks/MyTasksOverview` — در Dashboard مسیر `/home/projects/MyTasks` استفاده می‌شود |
| فیلتر اعلان‌ها (All/Unread/Read/Approval) | `features/notifications/NotificationList` — ساخته شد |
| تنظیمات و خروج حساب کاربری | `features/account/AccountSettings` — ساخته شد (پروفایل، تنظیمات حساب، سوییچ‌های اعلان، خروج با تایید) |
| ویجت‌های تکرارشونده (Activity Heatmap، Pie/Donut Chart) | `components/charts/{ActivityHeatmap, StatusDonutChart}` — ساخته شد |
| نوار پیشرفت قطعه‌قطعه (خلاصه‌ی پروژه‌ها در صفحه‌ی سازمان) | `components/charts/SegmentedProgressBar` — ساخته شد |
| باکس بوردردار مشترک صفحات Overview | `components/layout/{SectionTitle, SectionBox}` + `components/layout/StatTile` (باکس آماری «سلامت») + `components/layout/OrgLogo` (جای‌گزین لوگوی سازمان) — ساخته شد |
| هدر صفحه‌های اصلی تب‌ها | `components/layout/AppHeader` — ساخته شد (سفید، تمام‌عرض، با بوردر پایین) |

## ۵. لایه‌ی رنگی (Color Tokens)

منبع اصلی حقیقت رنگ‌ها فایل **`src/styles/colors.css`** است و دو لایه دارد:

1. **توکن‌های استاندارد shadcn/ui** — دقیقاً همان نام‌گذاری‌ای که ابزار theme رسمی shadcn تولید می‌کند: `--background`, `--foreground`, `--card`(+`-foreground`), `--popover`(+`-foreground`), `--primary`(+`-foreground`), `--secondary`(+`-foreground`), `--muted`(+`-foreground`), `--accent`(+`-foreground`), `--destructive`(+`-foreground`), `--border`, `--input`, `--ring`, `--chart-1`..`--chart-5`، و `--sidebar`/`--sidebar-foreground`/`--sidebar-primary`(+`-foreground`)/`--sidebar-accent`(+`-foreground`)/`--sidebar-border`/`--sidebar-ring` (برای کامپوننت‌های shadcn مثل Sidebar/Chart در آینده). **رنگ Primary/Brand این پروژه بنفش (`#B473F4`) است** و در هر دو تم روشن/تیره ثابت می‌ماند.
2. **نام‌مستعارهای اضافه‌ی خاص این پروژه** (`bg`, `bg2`, `bg3`, `bg4`, `text`, `text2`, `text3`, `text4`, `icon`, `icon2`, `icon3`, `brand`, `link`, `success`, `warning`, `error`, `overlay`, `text-on-brand`, `icon-on-brand`, `bg-brand`, `icon-brand`, `text-brand`) که هرکدام روی یکی از توکن‌های استاندارد بالا سوارند (مثلاً `--bg2: var(--muted)`, `--brand: var(--primary)`) — به‌خاطر «دو سطح پس‌زمینه»ی مستند در [DESIGN.md](./DESIGN.md#۲-سیستم-رنگ-color-system) حفظ شده‌اند و در اکثر کامپوننت‌ها استفاده می‌شوند (`bg-bg2`, `text-text2`, `text-brand`, ...).

سوییچ بین روشن/تیره سه حالته است: پیش‌فرض از طریق `@media (prefers-color-scheme: dark)` **داخل همین فایل** (حالت «هماهنگ با سیستم»)، و یک سوییچر دستی واقعی هم روی `<html data-theme="light|dark">` سوار است — رجوع به بخش ۹ («زبان و ظاهر»).

در `src/app/globals.css`:

1. `colors.css` ایمپورت می‌شود.
2. هر دو لایه‌ی بالا در بلوک `@theme inline` مستقیم به کلاس‌های Tailwind نگاشت می‌شوند — مثلاً `--color-primary: var(--primary)` و `--color-brand: var(--brand)`.
2.۵. **پس‌زمینه‌ی `body` روی `bg-bg2` است، نه `bg-background`** — دو سطح رنگی داریم: صفحه خاکستری روشن، سطح‌ها (هدر، نوار تب، باکس‌ها، فیلدها) سفید. هر باکس جدیدی که ساخته می‌شود باید `bg-background` بگیرد وگرنه در زمینه گم می‌شود؛ و هر المان شناوری که روی زمینه‌ی خاکستری حالت «انتخاب‌شده» دارد نباید از `bg-bg2` برای آن استفاده کند (چون هم‌رنگ زمینه می‌شود) — رجوع به [DESIGN.md](./DESIGN.md#۲-سیستم-رنگ-color-system).
3. `--radius` روی `0.375rem` تنظیم شده (شعاع کوچک و ثابت، مطابق [DESIGN.md](./DESIGN.md#۴-اندازهی-المانها)) — این یکی در `globals.css` تعریف شده، نه `colors.css`، چون رنگی نیست.

**قانون مهم:** اگر رنگ جدیدی لازم شد، اول به `colors.css` اضافه شود (چون آن فایل منبع طراحی است) — ترجیحاً به‌عنوان نام‌مستعار روی یکی از توکن‌های استاندارد shadcn، نه رنگ خام جدید — بعد در صورت نیاز در `@theme inline` نگاشت داده شود. رنگ‌های Hardcode (مثل `#B473F4` مستقیم در کامپوننت) ممنوع است — همیشه از طریق کلاس‌های Tailwind متصل به این توکن‌ها استفاده شود.

> رنگ‌های اختصاصی اولویت تسک (Priority: none/low/medium/high/urgent) که در [DESIGN.md](./DESIGN.md#۲-سیستم-رنگ-color-system) پیشنهاد شده‌اند، هنوز در `colors.css` تعریف نشده‌اند — هر وقت کامپوننت تسک ساخته شد باید این توکن‌ها به `colors.css` اضافه و اینجا مستند شوند.

## ۶. لایه‌ی دسترسی به داده (API Client)

- تمام درخواست‌ها به بک‌اند از یک ماژول متمرکز (مثلاً `lib/api/`) عبور می‌کنند؛ کامپوننت‌ها مستقیماً آدرس API را نمی‌دانند.
- تایپ‌های TypeScript مربوط به موجودیت‌ها (Task، Project، Organization، User، Notification) باید با فیلدهای مدل بک‌اند (رجوع به [BACKEND.md](./BACKEND.md#۳-مدل-داده)) هماهنگ نگه داشته شوند.
- مرورگر API را از مسیر هم‌مبدأ `/api/v1` صدا می‌زند؛ Next آن را به `QUIRE_API_ORIGIN` (پیش‌فرض `http://127.0.0.1:4000`) بازنویسی می‌کند. درخواست‌ها cookie نشست را همراه دارند.
- `backend-client.ts` مشترک خطاهای HTTP را تبدیل می‌کند. `projects.ts` و `my-tasks.ts` Taskها را از API می‌خوانند؛ `tasks.ts` ساخت و ویرایش را می‌فرستد؛ `organizations.ts` اطلاعات سازمان و فید فعالیت/کامنت صفحه‌بندی‌شده را می‌گیرد و کامنت سازمان را ثبت می‌کند؛ `ticket-comments.ts` رکورد Ticket و Activity را می‌خواند/ذخیره می‌کند و کامنت تازه را ثبت می‌کند.
- صفحه‌ها/کامپوننت‌ها نباید fetch مستقیم یا دسترسی SQLite داشته باشند. ورود، Organization/Division/Project، Task، Ticket، Notification و صفحه‌های پروژه از API/SQLite می‌آیند. بعضی تنظیمات نمای Board و پیوند Ticket به Task هنوز localStorage یا state مرورگر هستند.

### ابزارهای دستیار هوش مصنوعی

`features/ai/ai-assistant-dialog.tsx` پیام‌ها را از طریق `lib/api/assistant.ts` به `/api/v1/assistant/chat` می‌فرستد. کلید Nokod در بک‌اند می‌ماند و تاریخچه فقط در state پنجرهٔ گفتگو است. `features/ai/ai-tools.ts` قرارداد ابزارهای ساخت Task، ساخت Ticket و گزارش را نگه می‌دارد، اما مدل در این نسخه آن‌ها را خودکار اجرا نمی‌کند؛ هر عملیات تغییردهنده باید پس از تأیید کاربر اجرا شود.

## ۷. قانون مستندسازی ماژول‌ها

طبق [AGENTS.md](../AGENTS.md)، هر فیچر جدید که داخل `frontend/` ساخته می‌شود (مثلاً `features/tasks/`) باید یک `README.md` کوتاه داخل همان پوشه داشته باشد که توضیح دهد: این ماژول چه می‌کند، به کدام API/موجودیت‌های بک‌اند وابسته است، و با کدام ماژول‌های دیگر فرانت ارتباط دارد (مثلاً `TaskDetail` توسط `BoardView`، `TableView` و `TreeView` مشترکاً استفاده می‌شود). کامپوننت‌های خیلی کوچک/زیرساختی (مثل `BottomTabBar`) که هنوز به‌اندازه‌ی یک «فیچر» بزرگ نشده‌اند، فعلاً همین‌جا (بخش ۸) مستند می‌شوند؛ وقتی حجمشان زیاد شد به الگوی «پوشه + README.md» منتقل می‌شوند.

## ۸. وضعیت فعلی پیاده‌سازی (Implementation Status)

> این بخش با هر تغییر واقعی در کد به‌روزرسانی می‌شود؛ فهرست کامل نیست، فقط چیزی را که واقعاً ساخته شده ثبت می‌کند.

پروژه Next.js با `create-next-app` (TypeScript + Tailwind v4 + App Router + `src/`) در `frontend/` ساخته شده و shadcn/ui (Base UI، پریست Nova، RTL) روی آن Init شده است.

در اجرای توسعه، `next.config.ts` میزبان `127.0.0.1` را در `allowedDevOrigins` مجاز می‌کند؛ مرورگر محلی گاهی با این نام به‌جای `localhost` باز می‌شود و برای دریافت HMR باید هر دو مبدأ هماهنگ باشند.

**کامپوننت‌های نصب‌شده از shadcn** (`src/components/ui/`):

| کامپوننت | دلیل نصب اولیه |
|---|---|
| `button` | دکمه‌ی Ghost/Primary در سراسر اپ (سایز پیش‌فرض ۳۲px، `lg` معادل ۳۶px — مطابق [DESIGN.md](./DESIGN.md#۵-الگوی-دکمهها)) |
| `tabs` | نوار یکپارچهٔ Dashboard/Board/List/Calendar/Gantt پروژه و MyTasks در `ProjectSectionTabs`؛ فیلتر All/Unread/Read/Approval در اعلان‌ها هنوز نه |
| `avatar` | نمایش اعضا در `OrganizationOverview` استفاده شده (فعلاً فقط `AvatarFallback` با حرف اول اسم، بدون عکس واقعی) |
| `badge` | برچسب/وضعیت/اولویت — فعلاً فقط برای نشانه‌ی «این بخش هنوز ساخته نشده» در صفحات Placeholder استفاده شده |
| `separator` | جداکننده‌ی بین بخش‌های `OrganizationOverview` (هدر/خلاصه‌ی پروژه‌ها/آخرین فعالیت‌ها) |
| `direction` | `DirectionProvider`/`useDirection` برای پشتیبانی RTL |
| `dialog` | `MembersDialog` (مودال مدیریت اعضای سازمان)؛ `DialogContent` سه واریانت دارد — `variant="center"` (پیش‌فرض، مودال وسط‌چین معمولی)، `variant="side"` (پنل تمام‌ارتفاع چسبیده به سمت راست صفحه، تقریباً ۳۰٪ عرض — فعلاً بدون مصرف‌کننده: TaskPanel اکنون از taskWorkspace استفاده می‌کند)، و `variant="fullscreen"` (موبایل: تمام صفحه بدون گوشه‌ی گرد؛ از `sm:` به بعد یک مودال متمرکز معمولی — برای زیربخش‌هایی از جزئیات تسک که «صفحه»ی مجزا نیستند، مثل `FollowersDialog`/`TimerDialog`/`ActivityLogDialog`/`DateEditDialog`/`TagPickerDialog` در `features/tasks/`) |
| `dropdown-menu` | منوی سه‌نقطه‌ی `PageHeader`؛ نقش اعضا با select بومی در `MembersDialog` و تنظیمات سازمان انتخاب می‌شود |
| `popover` | `NotificationsPreviewDialog` — برخلاف `dialog`، **غیرمودال** است: بدون پس‌زمینه‌ی تیره، دقیقاً کنار همان آیکونی که کلیک شده باز می‌شود، با سایه‌ی کوچک (نه backdrop) از بقیه‌ی صفحه متمایز می‌شود، و با کلیک روی هر نقطه‌ی دیگر خودش بسته می‌شود |
| `switch` | تنظیمات اعلان‌ها و امکانات سازمان در `OrganizationSettingsPage` |

هر وقت کامپوننت جدیدی از shadcn اضافه شود، همین جدول به‌روزرسانی می‌شود.

**ساختار مسیر پیاده‌سازی‌شده:**

```
src/app/
  layout.tsx          → html[lang=fa][dir=rtl] + DirectionProvider (فونت IRANSansX از fonts.css، نه next/font)
  page.tsx             → ریدایرکت به /home
  (tabs)/
    layout.tsx          → رندر children + BottomTabBar ثابت در پایین صفحه
    home/page.tsx        → getOrganizations()/getMyTasks()/getCurrentUser() + HomeGreeting + WorkspaceList
    notifications/page.tsx → getNotifications(currentUser.name) + NotificationsFullPage
    tasks/[taskId]/page.tsx → getTask(id) + TaskDetailRoute (مقصد اعلان تخصیص)
    account/page.tsx     → getCurrentUser() + AccountSettings
    account/sessions/page.tsx → فهرست نشست‌ها با PageHeader و SessionsList
src/components/
  navigation/bottom-tab-bar.tsx → ناوبری ۴ تب پایین صفحه (Client Component، بر اساس pathname تب فعال را با رنگ brand مشخص می‌کند؛ از lg به بالا مخفی)
  navigation/sidebar-nav.tsx    → SidebarNav: ناوبری دسکتاپ (hidden lg:flex، ستون کناری راست چون RTL) — عنوان «Quire»
                                   + آیتم «تسک‌های من» + فهرست سازمان‌ها/پروژه‌ها (WorkspaceList، از (tabs)/layout.tsx prop می‌آید)
  navigation/desktop-header.tsx → DesktopHeader: هدر مستقل دسکتاپ، دقیقاً بالای ستون محتوا (نه بخشی از SidebarNav) — طرح
                                   Figma «Header»: اواتار→/account، NotificationsPreviewDialog، جستجوی دکوراتیو، دکمه‌ی «تسک جدید»
  navigation/page-header.tsx    → PageHeader مشترک صفحات جزئیات (بازگشت + عنوان + منوی سه‌نقطه) — رجوع به src/components/navigation/README.md
  layout/section.tsx            → SectionTitle + SectionBox (باکس بوردر+پدینگ‌۱۲px مشترک همه‌ی Overview ها)
```

**صفحه‌ی خانه، سازمان، پروژه و اعلان‌ها ساخته شده‌اند:**

```
src/lib/api/
  types.ts          → Member, ProjectRef (شامل progress), Task, Project, Organization (شامل createdAt), Notification (تایپ‌های مشترک همه‌ی این صفحات)
  mock-data.ts       → MOCK_ORGANIZATIONS + MOCK_PROJECTS + MOCK_NOTIFICATIONS (منبع واحد Mock — شناسه‌ها هماهنگ‌اند)
  organizations.ts   → getOrganizations(), getOrganization(id), getOrganizationActivity(id, page), createOrganizationComment(id, text)
  projects.ts         → getProject(id)
  notifications.ts    → getNotifications(recipientName), markNotificationRead(id, recipientName)
  users.ts            → getCurrentUser() (کاربر واردشده؛ تایپ CurrentUser + NotificationPreferences در types.ts)
  my-tasks.ts         → getMyTasks() و getMyTasksOverview() (همه‌ی وضعیت‌ها)
  calendar.ts         → getToday() (تاریخ «امروز» از لایه‌ی داده می‌آید، نه new Date())
  tasks.ts            → getTaskFormOptions(), getTask(id), createTask()/updateTask() (API پایدار + هویت سازنده برای اعلان)
src/components/charts/
  activity-heatmap.tsx    → ActivityHeatmap (گرید فعالیت شبیه گیت‌هاب — پروژه، تسک‌های من، پروفایل کاربر)
  status-donut-chart.tsx  → StatusDonutChart (چارت دایره‌ای چندبخشی SVG بدون کتابخانه‌ی خارجی)
  progress-ring.tsx       → ProgressRing (حلقه‌ی پیشرفت کوچک تک‌مقداری — WorkspaceList)
src/components/layout/
  org-logo.tsx            → OrgLogo (جای‌گزین لوگوی سازمان، اندازه‌پذیر — OrganizationOverview و WorkspaceList)
src/features/home/
  home-greeting.tsx → HomeGreeting: هدر خوش‌آمدگویی صفحه‌ی خانه (جایگزین AppHeader فقط اینجا) — «خوش آمدی {نام}» +
                        ردیف لینک «N تسک برای انجام داری امروز» (تعداد تسک‌های در حال انجام کاربر) → /home/projects/MyTasks
  workspace-list.tsx → WorkspaceList: آکوردئون سازمان‌ها؛ هر سازمان یک ردیف با نام (لینک) + OrgLogo + شورون باز/بسته؛
                        وقتی باز است پروژه‌هایش تورفته زیرش لیست می‌شوند، هرکدام با شماره‌ی ترتیبی + نام + درصد
                        پیشرفت (ProjectRef.progress) + ProgressRing. یک آیکون + برای افزودن پروژه‌ی جدید
                        (فقط state محلی، غیرماندگار) کنار شورون ظاهر می‌شود. بدون آیکون نوع (طبق بازخورد کاربر حذف شد).
src/features/organizations/
  organization-overview.tsx → OrganizationOverview: قاب workspace با سربرگ سازمان، جزئیات و فهرست معاونت/پروژه در پنل اصلی،
                                اعضا و تعداد تسک‌ها، فید فعالیت/کامنت صفحه‌بندی‌شده و افزودن پروژه از API؛ تب جزئیات/فعالیت در موبایل
  organization-activity-feed.tsx → OrganizationActivityFeed: نمایش و ثبت کامنت سازمان؛ صفحهٔ نخست ۱۵ رخداد است و با پیمایش پایین، رخدادهای قدیمی‌تر بارگیری می‌شوند
  members-dialog.tsx         → MembersDialog: نمایش آواتارها و مودال اعضا؛ دعوت حساب موجود با ایمیل و تغییر نقش‌های پایه از API سازمان
src/features/projects/
  organization-project-tree.tsx → درخت واکنش‌گرای سازمان/معاونت/پروژه برای ورودی /projects
  task-display.tsx        → ثابت‌ها/کامپوننت مشترک نماها: PRIORITY_LABEL/COLOR، STATUS_LABEL، STATUS_COLUMNS/STATUS_COLUMN_ICON، PriorityDot؛ Inbox فیلتر وضعیت را از همین قرارداد می‌سازد
  project-section-tabs.tsx → نوار یکپارچهٔ پروژه با Dashboard، نماها، و افزودن صفحه
  project-task-list.tsx    → ProjectTaskList (Client): محتوای نمای انتخاب‌شده از ۵ نما (زیر)
  views/table-view.tsx      → TableView: جدول واقعی با هدر ستون و بوردر بین همه‌ی سلول‌ها
  views/tree-view.tsx        → TreeView: باز/بسته کردن زیر-تسک‌ها (task.subtasks) + افزودن سریع بعد از هر ردیف سطح‌بالا با ورودی متمرکز
  views/board-view.tsx       → BoardView: کانبان با Drag & Drop واقعی (@dnd-kit)، ستون‌های استاندارد و ستون‌های دلخواه ذخیره‌شده برای پروژه؛ MyTasks اجتماع ستون‌ها را می‌سازد و مقصد را با پروژهٔ تسک تطبیق می‌دهد
  view-switcher.tsx         → TASK_VIEWS + ViewSwitcher: سوییچر قدیمی نماها (نوار فعال صفحه در ProjectSectionTabs است)
  views/timeline-view.tsx    → TimelineView: ساید‌بار جمع‌شونده‌ی تسک‌ها + تقویم افقی اسکرول‌شونده (مقیاس روزانه/هفتگی/ماهانه، دکمه‌ی «امروز»)
  views/calendar-view.tsx    → CalendarView: تقویم شمسی واقعی با نماهای هفته، ماه و فصل و پیمایش آزاد
  project-overview.tsx      → ProjectOverview: هدر پروژه با متادیتای خط‌به‌خط و انتخاب فایل پیوست، «سلامت پروژه» (SectionBox، ۴ باکس آماری)،
                               پراکندگی وضعیت تسک‌ها (SectionBox + StatusDonutChart)، تقویم سررسیدها (SectionBox، Placeholder ساده)،
                               فعالیت اعضا (SectionBox + ActivityHeatmap)
src/features/pages/
  document-page.tsx      → DocumentPage: ویرایش عنوان و متن سند پروژه با ذخیره از طریق project-pages API
  chat-page.tsx          → ChatPage: چت پروژه با پیام‌های ذخیره‌شده در API و واکشی دوره‌ای ۵ثانیه‌ای
src/features/tasks/
  task-create-form.tsx  → TaskCreateForm (Client): فرم ساخت تسک جدید (عنوان، پروژه، مسئول، سررسید،
                           اولویت، برچسب، توضیحات) — ذخیره فقط شبیه‌سازی است و به صفحه‌ی قبل برمی‌گردد
src/features/my-tasks/
  my-tasks-page-header.tsx → MyTasksPageHeader: PageHeader محیط پروژه‌ها با اکشن ساخت تسک
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
  home/page.tsx                     → getOrganizations()/getMyTasks()/getCurrentUser() + HomeGreeting + WorkspaceList
  home/organizations/[id]/page.tsx  → getOrganization(id)؛ اگر slug داشته باشد به `/o/[organizationSlug]` هدایت می‌شود، در غیر این صورت OrganizationOverview را در قاب workspace نشان می‌دهد
  home/organizations/[id]/settings/page.tsx → getOrganization(id) + OrganizationSettingsPage؛ تنظیمات عمومی و اعضای سازمان
  home/organizations/[id]/settings/permissions/[memberId]/page.tsx → ویرایش مجوز سفارشی یک عضو سازمان
  o/[organizationSlug]/page.tsx → OrganizationOverview در قاب workspace هم‌شکل ساخت تسک
  o/[organizationSlug]/[projectSlug]/page.tsx → alias خوانای صفحهٔ پروژه
  home/projects/[id]/page.tsx       → getProject(id) + ProjectPageHeader + ProjectSectionTabs → Dashboard / ۴ نمای تسک / سند و چت
  home/projects/MyTasks/page.tsx    → getMyTasks()/getMyTasksOverview() + ProjectNavigator + ProjectSectionTabs؛ نمای تجمیعی کاربر
  notifications/page.tsx            → getNotifications(currentUser.name) + NotificationsFullPage
  tasks/[taskId]/page.tsx            → getTask(id) + workspace جزئیات تسک
  account/page.tsx                  → getCurrentUser() + AccountSettings
  account/sessions/page.tsx         → عنوان و بازگشت صفحه + SessionsList برای فهرست/لغو نشست‌ها
src/app/tasks/new/page.tsx          → getTaskFormOptions() + PageHeader + TaskCreateForm (خارج از (tabs)، بدون Bottom Tab Bar)
src/features/users/user-profile.tsx → UserProfile: پروفایل + سازمان‌ها + ActivityHeatmap
src/app/users/[id]/page.tsx         → getUserById(id) + PageHeader + UserProfile؛ اگر id نامعتبر بود پیام «پیدا نشد»
```

**زبان و ظاهر** (رجوع کامل به بخش ۹):

```
src/lib/i18n/
  dictionary.ts    → Locale ("fa"|"en") + دیکشنری fa/en + t(locale, key) — امن برای سرور و کلاینت
  server.ts        → getLocale() (async، فقط Server Component — از next/headers cookies می‌خواند)
src/lib/theme.ts   → Theme ("light"|"dark"|"system") + THEME_COOKIE + parseTheme()
src/components/providers/
  locale-provider.tsx → LocaleProvider/useLocale/useT (Client Context، کوکی locale را می‌نویسد + router.refresh())
  theme-provider.tsx  → ThemeProvider/useTheme (Client Context، مستقیم data-theme را روی <html> می‌گذارد)
  app-providers.tsx   → پوسته‌ی مشترک (LocaleProvider + ThemeProvider + DirectionProvider جهت‌دار) — از layout.tsx صدا زده می‌شود
```

نکات مهم برای ادامه‌ی کار:

- **جزئیات تسک مودال است**: `TaskPanel` در پروژه و `/home/projects/MyTasks` میزبان Dialog مشترک NewTaskDialog است؛ وضعیت از TaskPanelProvider می‌آید و محتوای صفحه جمع یا پنهان نمی‌شود.
- انتخابگر وضعیت `TaskStatusPicker` در همین مودال، ستون‌های ثابت و دلخواه Board پروژهٔ انتخاب‌شده را نشان می‌دهد. دکمهٔ آن فقط آیکون با رنگ ستون است و نام وضعیت در برچسب دسترس‌پذیری و منو می‌آید. وضعیت‌های اصلی با `updateTask` و جایگاه «لغو شده»/ستون دلخواه با `board-column-storage.ts` ذخیره می‌شود. کلیک زیرتسک، همان قاب جزئیات را برای زیرتسک باز می‌کند؛ زیرتسک مستقل در Board نمی‌آید و ویرایش آن با PATCH تسک مادر و جایگزینی همان عضو `subtasks` ثبت می‌شود.
- **`/home/projects/MyTasks` و صفحه‌ی پروژه پس‌زمینه‌ی سفید دارند** (نه `bg2` عمومی بدنه) — برای اینکه سفید تا پایین صفحه کشیده شود، `main` و کانتینر `mx-auto` در layout یک ستون flex کشیده‌اند و خودِ صفحه `flex-1 bg-background` می‌گیرد.
- **هدرها بیرون از کانتینر `p-4` صفحه رندر می‌شوند**: `AppHeader` و `PageHeader` تمام‌عرض و سفیدند، پس ساختار هر صفحه به شکل «هدر + یک `div` با `p-4` برای محتوا» است، نه یک کانتینر `p-4` دور همه‌چیز. در صفحه‌ی پروژه و `/home/projects/MyTasks`، `ProjectSectionTabs` بیرون از پدینگ می‌نشیند (نوار تب تمام‌عرض، پدینگ داخل پنل‌ها).
- **`TimelineView` عمداً دو جهت دارد**: ساید‌بار تسک‌ها در جریان RTL صفحه می‌ماند، اما ناحیه‌ی تقویم `dir="ltr"` است تا تاریخ از چپ به راست جلو برود و `scrollLeft` رفتار استاندارد داشته باشد. هدر تاریخ داخل همان کانتینر اسکرول است تا با تقویم هم‌زمان حرکت کند؛ ارتفاع ردیف‌های ساید‌بار (`h-9`) و ردیف خالی زیر عنوان آن (`h-7`) باید دقیقاً با دو ردیف هدر تقویم یکی بماند وگرنه ردیف‌ها از تراز خارج می‌شوند.
- **`AddTaskFab` با کلاس‌های منطقی (`start-4`) جای‌گذاری شده**، نه `right-4` — چون کل اپ RTL است و `start` همان سمت راست است؛ اگر روزی LTR اضافه شد، دکمه خودبه‌خود به سمت درست می‌رود. ارتفاع `bottom` هم باید بالاتر از `h-14` نوار تب‌ها بماند.
- محاسبه‌های نسبی قدیمی تاریخ در `src/lib/jalali.ts` متمرکز است (`parseDate`, `formatDate`, `toOrdinal`/`fromOrdinal`, `addDays`, `startOfWeek`, `daysInMonth`, `MONTH_NAMES`, `isBefore`). این بخش **واقعی نیست**: کبیسه ندارد و `weekdayIndex` روز هفتهٔ واقعی را نمی‌دهد. `TimelineView` هنوز از آن استفاده می‌کند. `CalendarView` برای چیدمان دقیق روزها، کبیسه و جابه‌جایی هفته/ماه/فصل از `Intl.DateTimeFormat` با تقویم فارسی و تاریخ UTC استفاده می‌کند.
- **«امروز» از تاریخ جاری دستگاه در تقویم فارسی به‌دست می‌آید** (`currentJalaliDate` در `src/lib/jalali.ts`)؛ تاریخ‌های تسک همچنان رشته‌های جلالی‌اند.
- **تخصیص تسک به کاربر با مقایسه‌ی نام انجام می‌شود** چون `Task` هنوز `assigneeId` ندارد؛ با آمدن بک‌اند باید به شناسه تغییر کند.
- **تاریخ‌ها با رقم لاتین ذخیره می‌شوند** (`"1404/05/10"`)، نه رقم فارسی — چون `Number("۱۰")` در جاوااسکریپت `NaN` می‌دهد و منطق تقویم/Timeline را می‌شکند. اگر جایی نیاز به نمایش رقم فارسی بود، باید در لحظه‌ی نمایش فرمت شود، نه در لایه‌ی داده.
- **فرمول `mockActivity` در `mock-data.ts` باید ضریب‌های غیرمضرب‌ ۵ روی هر دو پارامتر (index و seed) داشته باشد** — نسخه‌ی اول (`(i*seed+seed)%5`) وقتی seed مضرب ۵ بود (مثلاً ۵) همیشه صفر می‌داد و کل ردیف فعالیت آن عضو طوسی/خالی نشان داده می‌شد. اگر seed جدیدی اضافه می‌کنید حواستان به این تله باشد.
- **`Timeline`/`Calendar` تاریخ‌ها را با یک تبدیل خطی ساده‌ی خودشان مقایسه می‌کنند** (نه تقویم جلالی واقعی با کبیسه/طول ماه دقیق) — کافی برای موقعیت نسبی، نه برای محاسبه‌ی تقویمی دقیق.
- رنگ اولویت «بالا» فعلاً از `--error` استفاده می‌کند چون توکن اختصاصی‌اش هنوز در `colors.css` نیست (رجوع به بخش ۵).
- صفحه‌های افزودهٔ هر پروژه با `project-pages.ts` در API/SQLite ذخیره می‌شوند؛ عنوان سند در نوار تب هم‌زمان تغییر می‌کند و پیام‌های جدید چت هر ۵ ثانیه برای به‌روزرسانی فهرست/نشان نخوانده واکشی می‌شوند.
- دعوت و تغییر نقش‌های پایهٔ عضو در `MembersDialog` و تنظیمات سازمان از API/SQLite ذخیره می‌شوند. تغییر وضعیت استاندارد تسک در `BoardView` با PATCH در API/SQLite ذخیره می‌شود؛ ستون‌های دلخواه و جایگاه Task در آن‌ها در localStorage هستند. ویرایش پروفایل/سوییچ‌های اعلان در `AccountSettings` هنوز فقط state مرورگر هستند؛ اعلان تخصیص Task و خوانده‌شدن آن در API/SQLite ذخیره می‌شوند.
- ورود و خروج نشست‌محور از API/SQLite انجام می‌شوند؛ `getCurrentUser()` کاربر نشست را می‌خواند. حساب اولیه با bootstrap ساخته می‌شود و ثبت‌نام عمومی در نصب تک‌حسابی غیرفعال است. Proxy نشست را برای مسیرهای صفحه‌ای بررسی می‌کند و API اعتبار نهایی نشست را تعیین می‌کند.
- ردیف‌های تنظیمات حساب که هنوز صفحه‌ی مقصد ندارند (تغییر ایمیل/رمز، راهنما، حریم خصوصی) عمداً غیرفعال و بدون فلش رندر می‌شوند تا کلیک‌پذیر به‌نظر نرسند. **«زبان» و «ظاهر» اما واقعاً کار می‌کنند** (نه Placeholder) — رجوع به بخش ۹.
- منوی سه‌نقطه‌ی `PageHeader` (افزودن تسک/مایل‌استون/بخش، تنظیمات، حذف) فعلاً فقط UI است؛ آیتم‌ها `onClick` ندارند چون صفحه/فرم مقصدشان هنوز ساخته نشده.
- **تنها کتابخانه‌ی خارجی UI پروژه تا این لحظه `@dnd-kit` است** (`@dnd-kit/core` + `@dnd-kit/utilities`)، فقط در `views/board-view.tsx` — برای Drag & Drop واقعی روی موبایل/ماوس. تست کامل ژست Drag روی دستگاه واقعی توصیه می‌شود؛ ابزارهای خودکار مرورگر گاهی رویداد Pointer را درست شبیه‌سازی نمی‌کنند.

## ۹. زبان و ظاهر (i18n و Theme)

هر دو تنظیم از بخش «حساب کاربری» (`AccountSettings`) قابل‌تغییرند و **سراسری‌اند** (روی همه‌ی صفحات اثر می‌گذارند، نه فقط همان صفحه).

### ۹.۱. زبان

- دو زبان: `fa` (فارسی، پیش‌فرض) و `en` (انگلیسی). منبع اصلی حقیقت کوکی `locale` است، نه فقط state کلاینت — چون بیشتر صفحات (`page.tsx`) Server Component‌اند و باید همان لحظه‌ی رندر سرور زبان درست را بدانند.
- `src/lib/i18n/dictionary.ts`: یک دیکشنری تخت با کلیدهای Namespace‌دار (`"nav.home"`, `"account.language"`, ...) برای **فقط متن‌های ثابت رابط کاربری** — نام سازمان/پروژه/تسک و هر داده‌ی دیگری که کاربر واقعی نوشته باشد **هرگز ترجمه نمی‌شود** (به همان زبانی می‌ماند که نوشته شده). تایپ `en` با `Record<keyof typeof fa, string>` مجبور می‌شود دقیقاً همان کلیدهای `fa` را کامل داشته باشد — اگر کلید جدیدی اضافه شود و در `en` فراموش شود، کامپایل خطا می‌دهد.
- **Server Component**: `import { getLocale } from "@/lib/i18n/server"` و `import { t } from "@/lib/i18n/dictionary"` → `t(await getLocale(), "nav.home")`.
- **Client Component**: `import { useT } from "@/components/providers/locale-provider"` → `const t = useT(); t("nav.home")`. برای خود مقدار زبان یا تغییر آن، `useLocale()` (`{ locale, setLocale, t }`).
- `setLocale(next)` هم کوکی را می‌نویسد هم بلافاصله state کلاینت را عوض می‌کند (برای واکنش فوری کامپوننت‌های Client مثل `SidebarNav`/`BottomTabBar`) و در نهایت `router.refresh()` صفحات سرور (عنوان‌ها، `PageHeader`) را با زبان جدید دوباره می‌رندر می‌کند — این یعنی سوییچ زبان یک رفرش RSC سبک دارد، نه فقط تغییر state.
- `<html lang dir>` و `DirectionProvider` (Base UI) هر دو از زبان جاری مشتق می‌شوند (`localeDir()`): فارسی = `rtl`، انگلیسی = `ltr`.
- ورودی‌های متنی، `textarea` و `select` در `globals.css` با جهت ریشهٔ صفحه تراز می‌شوند: فارسی راست و انگلیسی چپ؛ ورودی‌های عددی، تلفن، تاریخ و حالت‌های دارای `inputmode` عددی مستثنا هستند.
- **جهت آیکون‌های جهت‌دار باید دستی هماهنگ شود** — مثلاً فلش بازگشت `PageHeader` بر اساس جهت زبان بین `arrow-right-line` (RTL) و `arrow-left-line` (LTR) سوییچ می‌کند. آیکون‌های جهت‌دار عمیق‌تر (پیمایش ماه در `CalendarView`، اسکرول `TimelineView`) هنوز این‌کار را نکرده‌اند — اگر جایی به‌صورت بصری اشتباه به‌نظر رسید، همین الگو را تکرار کنید.
- **تله‌ی `items-end`/`items-start` روی `flex-col` در RTL**: برخلاف تصور رایج، `items-end` روی یک کانتینر `flex-col` متن/محتوا را در RTL به **چپ** می‌چسباند نه راست — چون محور عرضی یک ستون همان محور inline است و در RTL `end` منطقاً چپ است (`start` = راست). این باگ واقعی در `HomeGreeting` پیش آمد (رجوع به `features/home/README.md`). امن‌ترین راه برای راست‌چین کردن یک بلوک متنی در ستون: اصلاً `items-*` نگذارید و بگذارید پیش‌فرض `stretch` + `text-align` طبیعی (که از `dir` پیروی می‌کند) کار را انجام دهد — همان الگویی که در `organization-overview.tsx` استفاده شده.

**پوشش فعلی ترجمه** (فقط زیرمجموعه‌ای از UI که مستقیماً لمس شد؛ کامل نیست): ناوبری (`BottomTabBar`, `SidebarNav`, `DesktopHeader`, `NotificationsPreviewDialog`, `PageHeader`), صفحه‌ی «حساب کاربری» (کامل، هر دو دیالوگ), «خانه» (`HomeGreeting`, `WorkspaceList`), «تسک‌های من» (فهرست + Overview), «اعلان‌ها», Overview سازمان/پروژه + `MembersDialog`, `ProjectSectionTabs`, برچسب‌های وضعیت/اولویت مشترک (`status.*`/`priority.*` در دیکشنری — `PriorityDot` هم یک prop اختیاری `label` گرفته تا محل‌های چندزبانه بتوانند آن را بدهند)، و فرم ساخت تسک. **داخل نماها** (`board-view.tsx`, `table-view.tsx`, `tree-view.tsx`, `timeline-view.tsx`, `calendar-view.tsx`) و صفحه‌های سند/چت (`document-page.tsx`, `chat-page.tsx`) هنوز به این دیکشنری وصل نشده‌اند و همیشه فارسی نشان داده می‌شوند — وقتی کسی روی آن‌ها کار کرد، باید همین الگو (کلید در دیکشنری + `useT`/`t`) را ادامه دهد.

### ۹.۲. ظاهر (روشن/تیره/سیستم)

- سه حالت: `light`، `dark`، `system` (پیش‌فرض). کوکی `theme` منبع حقیقت است؛ `src/app/layout.tsx` آن را می‌خواند و روی `<html data-theme="light|dark">` می‌گذارد (در حالت `system` این attribute اصلاً روی صفحه نیست).
- `src/styles/colors.css` سه لایه دارد: `:root` (روشن، پیش‌فرض)، `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {...} }` (تیره‌ی خودکار وقتی کاربر صریحاً روشن را انتخاب نکرده)، و `:root[data-theme="dark"] {...}` (تیره‌ی صریح، صرف‌نظر از تنظیم سیستم). همین سه‌لایگی یعنی هر سه حالت (روشن/تیره/سیستم) بدون جاوااسکریپت هم بعد از رندر اول سرور درست‌اند — فلش تم اشتباه نداریم.
- برخلاف زبان، تغییر ظاهر به هیچ محتوای Server Component وابسته نیست (فقط CSS است)، پس `ThemeProvider` (`src/components/providers/theme-provider.tsx`) نیازی به `router.refresh()` ندارد: `setTheme` مستقیم `document.documentElement.dataset.theme` را عوض می‌کند (بازخورد فوری، بدون round-trip به سرور) و هم‌زمان کوکی را برای رندرهای بعدی ذخیره می‌کند.
- `useTheme()` (`{ theme, setTheme }`) در هر Client Component قابل‌استفاده است.

برای اجرای محلی، هر دو سرویس را اجرا کنید: `npm --prefix backend run dev` (پورت ۴۰۰۰) و `npm --prefix frontend run dev` (پورت ۳۰۰۰). `.claude/launch.json` هر دو را جداگانه تعریف می‌کند. `DATABASE_PATH` و `NEXT_PUBLIC_QUIRE_API_URL` برای تغییر محل SQLite و آدرس API هستند. اگر بعد از چند بار ادیت فایل‌ها خطاهای قدیمی Turbopack دیدید، سرور فرانت را متوقف کنید، `frontend/.next` را پاک کنید و دوباره اجرا کنید.

### اصلاح نوار پروژه

دکمهٔ جدول فعلاً از نوار پروژه حذف شده است؛ نمای جدول در کد و سایر مصرف‌کنندگان باقی می‌ماند. نشان تب فعال پروژه مشکی (`#141a1a`)، با ارتفاع ۵px و شعاع گوشه‌های بالایی ۴px است.

پیش‌نمایش اعلان هدر مطابق Figma `1723:29972` است: عرض ۳۹۳px محدود به عرض صفحه، گوشهٔ ۱۶px، بدون سایه، نوار فیلتر پروژه و نشان فعال مشکی با گوشه‌های بالایی گرد. صفحهٔ `/notifications` از همان نمای تب‌بندی‌شده استفاده می‌کند و BottomTabBar به آن لینک می‌دهد. تخصیص Task در بک‌اند اعلان پایدار می‌سازد؛ خواندن اعلان هم در API ذخیره می‌شود. دکمهٔ تنظیمات فقط در پیش‌نمایش هدر دسکتاپ است.

## معاونت‌ها و ساخت تیکت

`Organization.divisions` گروه‌بندی شرکت ← معاونت ← پروژه است. `Project.divisionId/divisionName` مرجع معاونت پروژه‌اند؛ `Organization.projects` نمای تجمیعی سازگار است. ناوبری پروژه، کارت‌های `/projects`، خانه و نمای شرکت از معاونت‌ها استفاده می‌کنند.

ورودی `/projects` با `features/projects/organization-project-tree.tsx` درخت سازمان/معاونت/پروژه را مطابق Figma `13972:1313` و `13972:1519` رندر می‌کند. دادهٔ سازمان‌ها از `getOrganizations()` و هویت هدر از `getCurrentUser()` می‌آید. در شروع همهٔ سازمان‌ها و معاونت‌ها بسته‌اند؛ ابتدا سازمان و بعد معاونت با گذار نرم CSS باز می‌شود. اکشن‌های بازکردن جزئیات، تنظیمات و ساخت معاونت در انتهای همان ردیف عنوان سازمان قرار می‌گیرند؛ اکشن‌های تنظیمات و ساخت پروژه برای معاونت و افزودن پروژه زیر معاونت بازشده هستند. تنظیمات سازمان/معاونت به Overview سازمان با انتخاب معاونت مناسب می‌رود. فرم ساخت معاونت/پروژه از API استفاده می‌کند. سربرگ پروفایل تمام‌عرض و بدون فاصله از هدر است. انتخاب پروژه به مسیر پویای `/home/projects/[id]` می‌رود. تنظیمات پروژه تصویر ندارد. بخش‌های گزارش سازمان و پروژه در این صفحه نیستند.

فیچر `frontend/src/features/tickets/` فرم ساخت تیکت و جزئیات Ticket را نگه می‌دارد؛ مسیر مستقل `/tickets/new` برای موبایل است و منوی «جدید» دسکتاپ مودال TicketCreateDialog را باز می‌کند. ساخت از داخل پروژه `projectId` را به فرم و API می‌رساند؛ Board پروژه تیکت‌های همان پروژه را نمایش می‌دهد و تیکت‌های بدون پروژه در برد «تسک‌های من» می‌مانند. فرم پروژه را از فهرست پروژه‌های کاربر می‌گیرد و انتخاب‌گر وضعیت از سه وضعیت و آیکون مشترک Board استفاده می‌کند. ردیف «ارجاع شده» پروفایل اعضای مجاز پروژه را در modal نشان می‌دهد؛ ذخیرهٔ ارجاع از API انجام می‌شود، اعلان پایدار برای گیرنده می‌سازد و Ticket در کارتابل او دیده می‌شود. در موبایل تب «جزئیات بیشتر» پیش‌فرض است و صفحهٔ ساخت تیکت BottomTabBar ندارد؛ ثبت در سربرگ و بستن در سمت مقابل آن قرار دارد. قرارداد داده در `lib/api/ticket-comments.ts` و `types.ts` است؛ کامنت‌نویسی فقط نقش کادر کامنت را دارد.

## ساخت موبایل

فیچر tasks میزبان `mobile-create-menu.tsx` (Dialog با زمینهٔ ۳۰٪ و گزینه‌های شناور) و `mobile-task-create-form.tsx` (صفحهٔ ساخت مطابق 1730:30051) است. `/tasks/new` گزینه‌ها و کاربر جاری را واکشی می‌کند و پروژهٔ انتخاب‌شده را از query می‌گیرد. فرم از DatePickerDialog، AssigneePickerDialog، TagPickerDialog، useTaskTimer و NewTaskActivity مشترک استفاده می‌کند. SVGهای موبایل در public/images/figma/mobile-task نگه‌داری می‌شوند.

## ساخت خودکار و چیدمان مشترک تسک

صفحهٔ ساخت تسک یک state مشترک دارد: زیر ۱۰۲۴px تمام عرض صفحه است، از ۱۰۲۴px یک قاب دسکتاپ با حداکثر عرض ۱۰۷۲px دارد. در مسیر قدیمی `/tasks/new` جزئیات و فعالیت در چیدمان تمام‌عرض قرار می‌گیرند؛ نوار `WorkspaceActionBar` دکمه‌های ثبت/انصراف را نشان می‌دهد و جای BottomTabBar را می‌گیرد. state تا ثبت صریح در حافظهٔ فرم می‌ماند؛ `features/tasks/local-created-tasks.ts` فقط هنگام ثبت موفق رکورد را در localStorage می‌نویسد. انصراف بدون ثبت رکورد به صفحهٔ قبل برمی‌گردد.

در نمای List/Tree، دکمهٔ افزودن سریع فقط زیر آخرین ردیف قرار دارد و یک ورودی عنوان متمرکز باز می‌کند؛ Enter تسک را با پروژهٔ جاری در API ذخیره می‌کند و به انتهای لیست می‌افزاید. اکشن شاخه روی ردیف تسک مادر، فرم ساخت زیرتسک را همان‌جا باز می‌کند؛ پس از واکشی نسخهٔ تازهٔ مادر، زیرتسک با `PATCH /tasks/:id` به آرایهٔ JSON آن افزوده و با تورفتگی ۱۶px زیر والد نمایش داده می‌شود. `TreeView` از حالت `avatarOnly` در `AssigneeField` استفاده می‌کند تا مسئولان فقط با آواتار و هم‌پوشانی ۴px دیده شوند و همان کنترل `AssigneePickerDialog` را باز کند. گروه‌بندی‌های Priority و Assignee در Board به صورت ستون‌های افقی نشان داده می‌شوند و Priority از رنگ‌های `PRIORITY_COLOR` بهره می‌برد. `BoardView` برای موبایل پیمایش لمسی افقی را روی ناحیه و کارت‌ها مجاز می‌کند؛ در دسکتاپ Pointer Drag روی فضای غیرتعاملی ستون، `scrollLeft` ظرف افقی را تغییر می‌دهد و روی کارت‌ها و کنترل‌ها فعال نمی‌شود.

`TreeRow` در نمای List شناسهٔ نمایشی را برای تسک مادر و زیرتسک رندر نمی‌کند؛ شناسه همچنان در داده و پنل جزئیات باقی می‌ماند.

## ساخت تیکت مطابق فضای تسک

فیچر tickets یک TicketWorkspace مشترک برای مودال هدر و صفحهٔ `/tickets/new` دارد. از DialogContent(taskWorkspace)، NewTaskAsset، MobileTaskAsset، NewTaskActivity و تب‌های مشترک استفاده می‌کند. ساخت Ticket فقط با «ثبت» در راست سربرگ انجام می‌شود و بستن در چپ است. تغییرات جزئیات Ticket پس از مکث کوتاه با `saveLocalTicket` ذخیره می‌شوند و دکمهٔ ذخیرهٔ دستی یا نوار پایین ندارند. فیلد ارجاع بالای موضوع است و برچسب‌های فیلدها کلاس مشترک رنگ/اندازه دارند؛ کادر کامنت اکشن ثبت ندارد. ثبت ساخت با بستن workspace و Toast شناسه‌دار همراه است؛ حذف نیز پیام شناسه‌دار می‌دهد. اولویت Ticket از مدل مشترک TaskPriority می‌آید. جزئیات Ticket، Follow/Favorite، کامنت و Activity از `ticket-comments.ts` و API/SQLite استفاده می‌کنند؛ فید از قدیمی به جدید مرتب است. در دسکتاپ دو ستون جزئیات/فعالیت و قاب حداکثر ۱۰۷۲px دارد. state فرم مستقل از تغییر اندازه حفظ می‌شود.

`NewTaskDialog` و فرم ساخت تیکت «ثبت» را فقط هنگام ساخت و بلافاصله سمت راست دکمهٔ بستن در سربرگ دارند؛ ویرایش تسک و زیرتسک با مکث کوتاه و `updateTask` خودکار ذخیره می‌شود. «تسک جدید» Board شناسهٔ پروژه را به `TaskPanelProvider.openNewTask(projectId)` می‌دهد؛ پس از ساخت، `router.refresh()` دادهٔ پروژه را می‌گیرد و `BoardView` فهرست محلی تسک‌ها را با ورودی تازه همگام می‌کند. `OrganizationProjectTree` برای ساخت سازمان و پروژه دکمهٔ «ثبت» را کنار دکمهٔ بستن در سربرگ فرم کوچک قرار می‌دهد. پس از ساخت، تنظیمات سازمان با `PATCH /organizations/:id/settings` و نام/توضیحات پروژه با `PATCH /projects/:id/settings` خودکار ذخیره می‌شوند؛ slug پروژه ثابت می‌ماند.

## کارتابل و فضای کاری تسک
`features/tickets/ticket-detail.tsx` جزئیات مشترک Ticket را از `ticket-data.ts` می‌خواند و `TicketWorkspace` را در مسیر `/inbox/[ticketId]` برای مشاهده/ویرایش همان رکورد باز می‌کند. در ناوبری نرم دسکتاپ، slot موازی `@modal` آن را به‌صورت مودال روی مسیر قبلی (Inbox یا Board) نمایش می‌دهد؛ مسیر مستقیم نیز Inbox را پشت همان قاب می‌آورد. در موبایل جزئیات تمام‌صفحه باقی می‌ماند؛ پنل Activities فضای باقیمانده را می‌گیرد و کادر کامنت فشردهٔ Figma `13966:1318` در پایین آن می‌ماند. کارت‌های Inbox و Board به همین شناسه و مسیر می‌روند؛ تغییرات ذخیره‌شده با رویداد محلی بین هر دو نما تازه می‌شوند. فهرست کامل تیکت‌ها در `/inbox` است.
`features/tickets/ticket-inbox.tsx` در `app/(tabs)/inbox` تیکت‌های SQLite را از API دریافت و فیلتر می‌کند. فیلتر مجوزها در modal چندانتخابی با Checkbox و جداکنندهٔ ردیف‌هاست؛ انتخاب چند مجوز به‌صورت OR اعمال می‌شود. موبایل از سربرگ/پروفایل، فیلتر افقی و کارت‌های Figma `1838:49884` استفاده می‌کند؛ در دسکتاپ هدر داخلی و پس‌زمینهٔ کارت‌ها حذف می‌شوند و TicketInbox حداکثر عرض ۸۰۰px دارد و وسط‌چین است؛ انتخاب کاربر با مودال مرکزی واکنش‌گرا و آواتار انجام می‌شود و فهرست وضعیت از `STATUS_COLUMNS` مشترک با Board می‌آید. ناحیهٔ اسکرول کارت‌ها با ارتفاع viewport محدود و بالای BottomTabBar نگه داشته می‌شود؛ با اسکرول، معرفی پروفایل با انیمیشن جمع می‌شود و فیلترها بالا می‌آیند. همه‌ی کارت‌ها در یک فهرست عادی و بدون پشته یا انیمیشن ورق‌زدن می‌مانند و تراز متن پروفایل/عنوان از جهت زبان پیروی می‌کند. وقتی هیچ تیکتی نیست، تصویر `public/images/empty-mailbox.png` و متن ۱۳px در مرکز تمام فضای فهرست قرار می‌گیرند. کلیک کارت به `/inbox/[ticketId]` می‌رود و همان رکورد مشترک را در TicketWorkspace باز می‌کند. تاریخچهٔ تسک در بخش فعالیت‌ها می‌ماند و آکوردئون تاریخچه از جزئیات حذف شده است. TaskPanel تنها میزبان Dialog است و NewTaskDialog را برای ساخت/ویرایش تسک مصرف می‌کند. `TaskRecurrence` در Task/NewTaskInput/TaskUpdateInput تعداد، نوع فاصلهٔ روزانه/هفتگی/ماهانه و روزهای انتخابی هفته را نگه می‌دارد؛ `repeat-picker.tsx` انتخابگر مشترک موبایل/دسکتاپ است.

در مسیر `/projects`، `OrganizationProjectTree` در دسکتاپ حداکثر ۸۰۰px عرض دارد و ارتفاع آن با محتوا تنظیم می‌شود؛ از هدر ۸px فاصله دارد. در موبایل تمام‌عرض باقی می‌ماند. هدر پروفایل در بالای کارت و تمام‌عرض است؛ نشان ساختمان فقط کنار سازمان است و معاونت تصویر ندارد. در `ProjectNavigator`، عنوان سازمان فونت ۱۶px و فلش باز/بستهٔ توپر در سمت راست دارد؛ ردیف معاونت ۸px padding سمت راست دارد. مدیر جاری می‌تواند پروژه را روی معاونت مقصد و معاونت را روی سربرگ سازمان مقصد Drag & Drop کند؛ آیکون دستگیره فقط برای سازمان‌های قابل‌مدیریت نشان داده می‌شود و خطای API کنار فهرست می‌آید.

ویرایش پروفایل در `features/account/` با `PATCH /api/v1/auth/me` ذخیره می‌شود. عکس قبل از ارسال کوچک و فشرده می‌شود؛ `TaskPanelProvider` کاربر ذخیره‌شده را به مینی‌بارها و هدر می‌رساند تا آواتار واقعی نشست در همه‌جا یکسان باشد. ردیف «نشست‌ها» در تنظیمات حساب به `/account/sessions` می‌رود؛ `features/account/sessions-list.tsx` نشست‌های واقعی را از `auth.ts` می‌گیرد و نوع دستگاه، مرورگر، نشست جاری، آخرین فعالیت و کنترل لغو را نشان می‌دهد؛ API هویت نشست جاری را از cookie می‌خواند.
