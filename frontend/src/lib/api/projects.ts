import { MOCK_PROJECTS } from "./mock-data"
import type { Project } from "./types"

/**
 * فعلاً داده‌ی Mock برمی‌گرداند. وقتی بک‌اند Django آماده شد، جایگزین GET /api/projects/<id>/overview/
 * می‌شود (رجوع به docs/BACKEND.md بخش ۴) بدون تغییر در کامپوننت‌های مصرف‌کننده.
 */
export async function getProject(id: string): Promise<Project | undefined> {
  return MOCK_PROJECTS.find((project) => project.id === id)
}
