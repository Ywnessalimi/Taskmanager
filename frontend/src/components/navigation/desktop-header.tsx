import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RemixIcon } from "@/components/ui/remix-icon"
import { NewTaskDialog } from "@/features/tasks/new-task-dialog"
import { NotificationsPreviewDialog } from "@/features/notifications/notifications-preview-dialog"
import { t } from "@/lib/i18n/dictionary"
import { getLocale } from "@/lib/i18n/server"
import type { CurrentUser, Notification, TaskFormProjectOption } from "@/lib/api/types"

/**
 * هدر بالای بخش اصلی صفحه در نسخه‌ی دسکتاپ — کاملاً مستقل از `SidebarNav` (که کنارش،
 * نه بالایش، قرار دارد؛ رجوع به `components/navigation/README.md`). چیدمانش از طرح Figma
 * «AlignUI — Header» گرفته شده، با آیکون‌های خودمان به‌جای آیکون‌های طرح؛ بخش «نام پروژه +
 * دکمه‌ی منو»ی طرح که به مفهومی در اپ ما وابسته نیست (اپ ما همیشه یک «پروژه‌ی جاری» ندارد)
 * عمداً پیاده نشده. برخلاف طرح Figma (که این خوشه‌ی آیکون‌ها را سمت شروع می‌گذاشت)، طبق
 * بازخورد کاربر با `justify-end` سمت چپ صفحه نشانده شده — تنها انحراف عمدی از طرح در همین فایل.
 *
 * Server Component است (برخلاف بقیه‌ی اجزای ناوبری) چون فقط لینک/متن ایستا دارد؛ بخش‌های
 * تعاملی‌اش (`NotificationsPreviewDialog`, `NewTaskDialog`) خودشان Client Component جدا هستند.
 */
export async function DesktopHeader({
  currentUser,
  notifications,
  taskFormProjects,
}: {
  currentUser: CurrentUser
  notifications: Notification[]
  taskFormProjects: TaskFormProjectOption[]
}) {
  const locale = await getLocale()

  return (
    <header className="hidden h-14 items-center justify-end gap-3 border-b border-border bg-background px-4 lg:flex">
      <Link href="/account" aria-label={t(locale, "nav.account")}>
        <Avatar>
          {currentUser.avatarUrl && <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />}
          <AvatarFallback>{currentUser.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
      </Link>

      <NotificationsPreviewDialog notifications={notifications} />

      <span aria-label={t(locale, "nav.search")} className="flex size-8 items-center justify-center text-icon2">
        <RemixIcon name="search-2-line" className="text-lg" />
      </span>

      <div className="h-4.5 w-px bg-border" />

      <NewTaskDialog projects={taskFormProjects} />
    </header>
  )
}
