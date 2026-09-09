import { MOCK_NOTIFICATIONS } from "./mock-data"
import type { Notification } from "./types"

/**
 * فعلاً داده‌ی Mock برمی‌گرداند. وقتی بک‌اند Django آماده شد، جایگزین GET /api/notifications/
 * می‌شود (رجوع به docs/BACKEND.md بخش ۴) بدون تغییر در کامپوننت‌های مصرف‌کننده.
 */
export async function getNotifications(): Promise<Notification[]> {
  return MOCK_NOTIFICATIONS
}
