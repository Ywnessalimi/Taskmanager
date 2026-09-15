import { PageHeader } from "@/components/navigation/page-header"
import { TaskCreateForm } from "@/features/tasks/task-create-form"
import { t } from "@/lib/i18n/dictionary"
import { getLocale } from "@/lib/i18n/server"
import { getTaskFormOptions } from "@/lib/api/tasks"

/**
 * `h-dvh flex-col` روی این صفحه است تا نوار «ساخت تسک»/«انصراف» بتواند همیشه (حتی وقتی
 * فرم کوتاه است و اسکرول لازم ندارد) دقیقاً چسبیده به پایین صفحه بماند — رجوع به
 * `TaskCreateForm` (فیلدها در ناحیه‌ی میانیِ اسکرول‌شونده‌اند، نوار پایین بیرون آن).
 */
export default async function NewTaskPage() {
  const [projects, locale] = await Promise.all([getTaskFormOptions(), getLocale()])

  return (
    <div className="flex h-dvh flex-col">
      <PageHeader title={t(locale, "taskForm.title")} />
      <TaskCreateForm projects={projects} />
    </div>
  )
}
