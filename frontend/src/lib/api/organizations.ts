import { MOCK_ORGANIZATIONS } from "./mock-data"
import type { Organization } from "./types"

/**
 * فعلاً داده‌ی Mock برمی‌گرداند. وقتی بک‌اند Django آماده شد، جایگزین GET /api/organizations/
 * می‌شود (رجوع به docs/BACKEND.md بخش ۴) بدون تغییر در کامپوننت‌های مصرف‌کننده.
 */
export async function getOrganizations(): Promise<Organization[]> {
  return MOCK_ORGANIZATIONS
}

export async function getOrganization(id: string): Promise<Organization | undefined> {
  return MOCK_ORGANIZATIONS.find((org) => org.id === id)
}
