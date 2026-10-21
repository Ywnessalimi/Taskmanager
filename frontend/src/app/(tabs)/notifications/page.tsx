import { getNotifications } from "@/lib/api/notifications"
import { getTaskFormOptions } from "@/lib/api/tasks"
import { getCurrentUser } from "@/lib/api/users"
import { NotificationsFullPage } from "@/features/notifications/notifications-preview-dialog"

export default async function NotificationsPage() {
  const [projects, user] = await Promise.all([getTaskFormOptions(), getCurrentUser()])
  const notifications = await getNotifications(user.name)
  return <NotificationsFullPage notifications={notifications} projects={projects} recipientName={user.name} />
}
