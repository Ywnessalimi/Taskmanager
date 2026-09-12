import { PageHeader } from "@/components/navigation/page-header"
import { SectionTabs } from "@/features/pages/section-tabs"
import { ProjectOverview } from "@/features/projects/project-overview"
import { ProjectTaskList } from "@/features/projects/project-task-list"
import { getToday } from "@/lib/api/calendar"
import { getProject } from "@/lib/api/projects"
import { getCurrentUser } from "@/lib/api/users"

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [project, today, user] = await Promise.all([getProject(id), getToday(), getCurrentUser()])

  if (!project) {
    return (
      <div className="p-4">
        <p className="text-sm text-text2">پروژه‌ای با این شناسه پیدا نشد.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title={project.name}
        subtitle={project.organizationName}
        menu={[
          [
            { label: "افزودن تسک", icon: "task-line" },
            { label: "افزودن مایل‌استون", icon: "flag-line" },
            { label: "افزودن بخش", icon: "layout-column-line" },
          ],
          [{ label: "تنظیمات پروژه", icon: "settings-3-line" }],
          [{ label: "حذف پروژه", icon: "delete-bin-line", destructive: true }],
        ]}
      />

      <SectionTabs
        currentUserName={user.name}
        listContent={<ProjectTaskList project={project} today={today} />}
        overviewContent={<ProjectOverview project={project} />}
      />
    </div>
  )
}
