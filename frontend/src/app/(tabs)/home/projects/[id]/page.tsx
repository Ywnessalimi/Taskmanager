import { PageHeader } from "@/components/navigation/page-header"
import { SectionTabs } from "@/features/pages/section-tabs"
import { ProjectOverview } from "@/features/projects/project-overview"
import { ProjectTaskList } from "@/features/projects/project-task-list"
import { t } from "@/lib/i18n/dictionary"
import { getLocale } from "@/lib/i18n/server"
import { getToday } from "@/lib/api/calendar"
import { getProject } from "@/lib/api/projects"
import { getCurrentUser } from "@/lib/api/users"

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [project, today, user, locale] = await Promise.all([
    getProject(id),
    getToday(),
    getCurrentUser(),
    getLocale(),
  ])

  if (!project) {
    return (
      <div className="p-4">
        <p className="text-sm text-text2">{t(locale, "project.notFound")}</p>
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
            { label: t(locale, "project.addTask"), icon: "task-line" },
            { label: t(locale, "project.addMilestone"), icon: "flag-line" },
            { label: t(locale, "project.addSection"), icon: "layout-column-line" },
          ],
          [{ label: t(locale, "project.settings"), icon: "settings-3-line" }],
          [{ label: t(locale, "project.delete"), icon: "delete-bin-line", destructive: true }],
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
