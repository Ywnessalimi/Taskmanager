import { MOCK_ORGANIZATIONS, MOCK_PROJECTS } from "./mock-data"
import type { NewTaskInput, TaskFormProjectOption, TaskUpdateInput } from "./types"

/**
 * گزینه‌های سلکت‌های فرم ساخت تسک: هر پروژه به‌همراه اعضای سازمانی که به آن پروژه دسترسی
 * دارند (طبق docs/PRODUCT_OVERVIEW.md مسئول تسک از میان اعضای همان سازمان انتخاب می‌شود).
 * وقتی بک‌اند آماده شد، جایگزین GET /api/projects/ + اعضای هر پروژه می‌شود.
 */
export async function getTaskFormOptions(): Promise<TaskFormProjectOption[]> {
  return MOCK_PROJECTS.map((project) => {
    const organization = MOCK_ORGANIZATIONS.find((org) => org.id === project.organizationId)
    return {
      id: project.id,
      name: project.name,
      organizationName: project.organizationName,
      members: organization?.members.map((member) => ({ name: member.name, avatarUrl: member.avatarUrl })) ?? [],
    }
  })
}

/**
 * ساخت تسک — عمداً هیچ‌جا ذخیره نمی‌شود. داده‌ی Mock در ماژول ثابت است و نوشتن در آن، حالتِ
 * سرور را بین رفرش‌ها نگه نمی‌دارد و فقط توهم ذخیره‌سازی می‌ساخت. وقتی بک‌اند Django آماده شد،
 * این تابع به POST /api/tasks/ وصل می‌شود (رجوع به docs/BACKEND.md بخش ۴).
 */
export async function createTask(input: NewTaskInput): Promise<void> {
  console.info("createTask (هنوز ذخیره نمی‌شود):", input)
}

/**
 * ویرایش تسک — مثل `createTask` فعلاً جایی ذخیره نمی‌شود؛ پنل جزئیات تسک تغییرها را در
 * state خودش نگه می‌دارد و با بستن پنل از بین می‌روند. با آمدن بک‌اند به PATCH /api/tasks/<id>/
 * وصل می‌شود.
 */
export async function updateTask(input: TaskUpdateInput): Promise<void> {
  console.info("updateTask (هنوز ذخیره نمی‌شود):", input)
}
