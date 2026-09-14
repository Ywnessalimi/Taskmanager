import { MOCK_CURRENT_USER, MOCK_ORGANIZATIONS } from "./mock-data"
import type { CurrentUser, PublicUser } from "./types"

/**
 * فعلاً داده‌ی Mock برمی‌گرداند. وقتی بک‌اند Django آماده شد، جایگزین GET /api/me/ می‌شود
 * (رجوع به docs/BACKEND.md بخش ۴) بدون تغییر در کامپوننت‌های مصرف‌کننده.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  return MOCK_CURRENT_USER
}

/**
 * پروفایل عمومی هر کاربر (نه فقط کاربر واردشده) — برای صفحه‌ی `/users/[id]`.
 * چون مدل داده هنوز موجودیت جدای «User» ندارد، عضو با این شناسه در میان اعضای همه‌ی
 * سازمان‌ها جست‌وجو می‌شود (رجوع به `src/features/users/README.md`). وقتی بک‌اند آماده شد،
 * جایگزین GET /api/users/{id}/ می‌شود.
 */
export async function getUserById(id: string): Promise<PublicUser | null> {
  const memberOrgs = MOCK_ORGANIZATIONS.filter((org) => org.members.some((member) => member.id === id))
  const member = memberOrgs[0]?.members.find((m) => m.id === id)
  if (!member) return null

  const isCurrentUser = id === MOCK_CURRENT_USER.id

  return {
    id: member.id,
    name: member.name,
    role: member.role,
    activity: member.activity,
    email: isCurrentUser ? MOCK_CURRENT_USER.email : undefined,
    bio: isCurrentUser ? MOCK_CURRENT_USER.bio : undefined,
    avatarUrl: isCurrentUser ? MOCK_CURRENT_USER.avatarUrl : undefined,
    organizations: memberOrgs.map((org) => ({ id: org.id, name: org.name })),
  }
}
