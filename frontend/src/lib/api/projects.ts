import { MOCK_ORGANIZATIONS, MOCK_PROJECTS } from "./mock-data"
import type { Project } from "./types"

/**
 * فعلاً داده‌ی Mock برمی‌گرداند. وقتی بک‌اند Django آماده شد، جایگزین GET /api/projects/<id>/overview/
 * می‌شود (رجوع به docs/BACKEND.md بخش ۴) بدون تغییر در کامپوننت‌های مصرف‌کننده.
 *
 * `members` اینجا از اعضای سازمان مالک پروژه ساخته می‌شود (نه فیلد Mock جدا)، مثل همان
 * الگویی که `getTaskFormOptions` در `tasks.ts` برای اعضای قابل‌انتخاب هر پروژه استفاده می‌کند.
 */
export async function getProject(id: string): Promise<Project | undefined> {
  const project = MOCK_PROJECTS.find((project) => project.id === id)
  if (!project) return undefined
  const organization = MOCK_ORGANIZATIONS.find((org) => org.id === project.organizationId)
  return { ...project, members: organization?.members ?? [] }
}
