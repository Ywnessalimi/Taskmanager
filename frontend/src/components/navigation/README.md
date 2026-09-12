# components/navigation

اجزای ناوبری مشترک در سراسر اپ.

- `bottom-tab-bar.tsx` → `BottomTabBar`: ناوبری ۴ تب پایین صفحه (Client Component).
- `page-header.tsx` → `PageHeader`: هدر مشترک صفحات جزئیات (سازمان، پروژه، …) — دکمه‌ی بازگشت (فلش رو‌به‌راست چون RTL، با `router.back()`)، عنوان/زیرعنوان، و منوی سه‌نقطه‌ی اختیاری (`menu`: آرایه‌ای از گروه‌ها که با جداکننده از هم جدا می‌شوند). مصرف‌کننده‌ها: `src/app/(tabs)/home/organizations/[id]/page.tsx` و `.../projects/[id]/page.tsx`.

- `add-task-fab.tsx` → `AddTaskFab`: دکمه‌ی گرد شناور به رنگ برند با آیکون «+» که به `/tasks/new` می‌رود. مصرف‌کننده‌ها: `src/app/(tabs)/home/page.tsx` و `src/app/(tabs)/my-tasks/page.tsx`. جای‌گذاری با کلاس‌های منطقی (`start-4`) انجام شده نه `right-4`، چون اپ RTL است و `start` همان سمت راست می‌شود؛ `bottom-18` هم دکمه را بالای نوار تب‌های `h-14` نگه می‌دارد. تنها المان پررنگ برند در این صفحه‌هاست (طبق docs/DESIGN.md).

هر صفحه‌ی جزئیات جدیدی که بعداً اضافه شود (مثلاً جزئیات تسک) باید از همین `PageHeader` استفاده کند تا هدر در کل اپ یکدست بماند — به‌جای ساختن هدر اختصاصی جدید.
