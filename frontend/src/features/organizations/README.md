# organizations

این فیچر ساختار سازمان، معاونت و پروژه را از API نمایش می‌دهد. صفحهٔ `/home/organizations/[id]/settings` نام، تصویر، توضیحات و slug سازمان را در API ذخیره می‌کند و اعضا را با نقش مالک، مدیر دسترسی و دسترسی سفارشی مدیریت می‌کند. انتخاب دسترسی سفارشی به صفحهٔ مجوزها می‌رود؛ بک‌اند یکتایی مالک و مجوز هر عملیات را کنترل می‌کند. تنظیمات گزینه‌ها نیز در SQLite نگه‌داری می‌شوند. مسیرهای `/o/[organizationSlug]` و `/o/[organizationSlug]/[projectSlug]` سازمان و پروژه را از slug پایدار باز می‌کنند؛ مسیرهای شناسه‌محور قدیمی به این مسیرها هدایت می‌شوند. درخت سازمان می‌تواند تصویر بارگذاری‌شده را طبق گزینهٔ نمایش در نوار کناری نشان دهد.

وابستگی‌ها: APIهای `src/lib/api/organizations.ts` و `src/lib/api/projects.ts`، helper مسیرهای `src/lib/organization-paths.ts`، قراردادهای `Organization`, `OrganizationMember` و `ProjectRef` در `src/lib/api/types.ts` و اجزای مشترک layout, tabs, avatar و dialog.

مصرف‌کننده‌ها: `app/(tabs)/projects`، `app/(tabs)/home/organizations/[id]`، `app/(tabs)/home/organizations/[id]/settings`، `app/(tabs)/home/organizations/[id]/settings/permissions/[memberId]`، مسیرهای عمومی‌نما در `app/(tabs)/o/` و صفحه‌های خانه و پروژه. دعوت به ایمیل کاربری که از قبل حساب دارد انجام می‌شود؛ سامانهٔ ثبت‌نام/دعوت عمومی هنوز فعال نیست.
