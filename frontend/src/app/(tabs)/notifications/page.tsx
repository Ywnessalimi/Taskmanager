import { AppHeader } from "@/components/layout/app-header"
import { NotificationList } from "@/features/notifications/notification-list"
import { t } from "@/lib/i18n/dictionary"
import { getLocale } from "@/lib/i18n/server"
import { getNotifications } from "@/lib/api/notifications"

export default async function NotificationsPage() {
  const [notifications, locale] = await Promise.all([getNotifications(), getLocale()])

  return (
    <div className="flex flex-col">
      <AppHeader title={t(locale, "notifications.title")} />
      <div className="p-4">
        <NotificationList notifications={notifications} />
      </div>
    </div>
  )
}
