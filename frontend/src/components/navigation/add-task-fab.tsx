import Link from "next/link"
import { RemixIcon } from "@/components/ui/remix-icon"

/**
 * دکمه‌ی گرد شناور «تسک جدید» — تنها المان پررنگ به رنگ برند در صفحه (طبق docs/DESIGN.md
 * رنگ برند فقط برای اکشن اصلی استفاده می‌شود). در تب‌های «خانه» و «تسک‌های من» نمایش داده می‌شود.
 *
 * `start-4` (نه `right-4`) عمدی است: کل اپ RTL است و `start` همان سمت راست می‌شود.
 * `bottom-18` هم دکمه را بالای نوار تب‌های ۵۶ پیکسلی (`h-14`) نگه می‌دارد.
 */
export function AddTaskFab() {
  return (
    <Link
      href="/tasks/new"
      aria-label="ساخت تسک جدید"
      className="fixed bottom-18 start-4 z-50 flex size-12 items-center justify-center rounded-full bg-brand text-icon-on-brand hover:opacity-90"
    >
      <RemixIcon name="add-line" className="text-2xl" />
    </Link>
  )
}
