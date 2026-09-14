import { PageHeader } from "@/components/navigation/page-header"
import { TaskCreateForm } from "@/features/tasks/task-create-form"
import { t } from "@/lib/i18n/dictionary"
import { getLocale } from "@/lib/i18n/server"
import { getTaskFormOptions } from "@/lib/api/tasks"

export default async function NewTaskPage() {
  const [projects, locale] = await Promise.all([getTaskFormOptions(), getLocale()])

  return (
    <div className="flex flex-col">
      <PageHeader title={t(locale, "taskForm.title")} />
      <div className="p-4">
        <TaskCreateForm projects={projects} />
      </div>
    </div>
  )
}
