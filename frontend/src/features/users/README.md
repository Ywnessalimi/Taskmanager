# features/users

پروفایل عمومیِ قابل‌مشاهده‌ی هر کاربر (نه فقط کاربر واردشده) — صفحه‌ای که با کلیک روی نام عامل رخداد در «اعلان‌ها» باز می‌شود (رجوع به [features/notifications/README.md](../notifications/README.md)).

## چه‌کار می‌کند

- `user-profile.tsx` → `UserProfile` (Client): پروفایل + «سازمان‌ها» (لینک به هرکدام) + «فعالیت» (`ActivityHeatmap`). اگر کاربر همان کاربر واردشده باشد، ایمیل/توضیحات هم نشان داده می‌شود (چون فقط برای او در دسترس است — پایین را ببینید).

## وابستگی‌ها

- داده: `src/lib/api/users.ts` (`getUserById`) و تایپ `PublicUser` در `src/lib/api/types.ts`.
- UI: `components/ui/avatar.tsx`، `components/layout/section.tsx` (`SectionBox`/`SectionTitle`)، `components/charts/activity-heatmap.tsx`.
- مصرف‌کننده: `src/app/users/[id]/page.tsx` (خارج از `(tabs)`، مثل `app/tasks/new/page.tsx` — یک صفحه‌ی جزئیات پشته‌ای با `PageHeader`، بدون نوار تب پایین).

## چرا مدل داده‌اش این‌شکلی است

پروژه هنوز موجودیت جدای «User» ندارد — فقط `Member` داخل هر `Organization` (رجوع به [docs/PRODUCT_OVERVIEW.md](../../../../docs/PRODUCT_OVERVIEW.md) بخش «واژه‌نامه»). پس `getUserById(id)` در `users.ts` بین اعضای همه‌ی سازمان‌ها (`MOCK_ORGANIZATIONS`) دنبال شناسه می‌گردد؛ اگر پیدا نشد `null` برمی‌گرداند (صفحه پیام «کاربری با این شناسه پیدا نشد» نشان می‌دهد).

**ایمیل/توضیحات/عکس فقط برای کاربر واردشده پر می‌شود** — چون `Member` این فیلدها را اصلاً ندارد (فقط `CurrentUser` دارد) و مدل Mock فعلی داده‌ی مشابهی برای بقیه‌ی اعضا تعریف نکرده. وقتی بک‌اند واقعی و موجودیت `User` مستقل آمد، این محدودیت باید برداشته شود.

## نکات ناقص فعلی

- ویرایش پروفایل یا هر اکشن دیگری اینجا نیست — این صفحه فقط نمایشی/فقط‌خواندنی است.
- تنها ورودی فعلی این صفحه از «اعلان‌ها» است؛ لیست اعضای سازمان (`MembersDialog`) هنوز به آن لینک نمی‌دهد.
