import { MOCK_CURRENT_USER } from "./mock-data"
import type { CurrentUser } from "./types"

/**
 * فعلاً داده‌ی Mock برمی‌گرداند. وقتی بک‌اند Django آماده شد، جایگزین GET /api/me/ می‌شود
 * (رجوع به docs/BACKEND.md بخش ۴) بدون تغییر در کامپوننت‌های مصرف‌کننده.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  return MOCK_CURRENT_USER
}
