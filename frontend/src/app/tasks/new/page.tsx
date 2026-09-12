import { PageHeader } from "@/components/navigation/page-header"
import { TaskCreateForm } from "@/features/tasks/task-create-form"
import { getTaskFormOptions } from "@/lib/api/tasks"

export default async function NewTaskPage() {
  const projects = await getTaskFormOptions()

  return (
    <div className="flex flex-col">
      <PageHeader title="تسک جدید" />
      <div className="p-4">
        <TaskCreateForm projects={projects} />
      </div>
    </div>
  )
}
