import { AppHeader } from "@/components/layout/app-header"
import { NotificationList } from "@/features/notifications/notification-list"
import { getNotifications } from "@/lib/api/notifications"

export default async function NotificationsPage() {
  const notifications = await getNotifications()

  return (
    <div className="flex flex-col">
      <AppHeader title="اعلان‌ها" />
      <div className="p-4">
        <NotificationList notifications={notifications} />
      </div>
    </div>
  )
}
