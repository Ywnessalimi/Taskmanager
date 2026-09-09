import { NotificationList } from "@/features/notifications/notification-list"
import { getNotifications } from "@/lib/api/notifications"

export default async function NotificationsPage() {
  const notifications = await getNotifications()

  return (
    <div className="flex flex-col gap-3 p-4">
      <h1 className="text-base font-medium text-foreground">اعلان‌ها</h1>
      <NotificationList notifications={notifications} />
    </div>
  )
}
