import { SectionTabs } from "@/features/pages/section-tabs"
import { ProjectOverview } from "@/features/projects/project-overview"
import { ProjectPageHeader } from "@/features/projects/project-page-header"
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

  const isAdmin = project.members.some((member) => member.name === user.name && member.role === "admin")

  return (
    <div className="flex flex-1 flex-col bg-background">
      <ProjectPageHeader
        title={project.name}
        subtitle={project.organizationName}
        projectId={project.id}
        isAdmin={isAdmin}
      />

      <SectionTabs
        currentUserName={user.name}
        listContent={<ProjectTaskList project={project} today={today} />}
        overviewContent={<ProjectOverview project={project} />}
      />
    </div>
  )
}
