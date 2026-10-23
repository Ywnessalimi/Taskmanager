import { WorkspaceRouteModal } from "@/components/ui/workspace-route-modal"
import { ProjectNotFound, ProjectWorkspace } from "@/features/projects/project-workspace"
import { getToday } from "@/lib/api/calendar"
import { getOrganizations } from "@/lib/api/organizations"
import { getProject } from "@/lib/api/projects"
import { getCurrentUser } from "@/lib/api/users"
import { getLocale } from "@/lib/i18n/server"
import { t } from "@/lib/i18n/dictionary"

export default async function ProjectIdModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (id === "MyTasks") return null
  const [project, today, user, locale, organizations] = await Promise.all([
    getProject(id), getToday(), getCurrentUser(), getLocale(), getOrganizations(),
  ])

  if (!project) return <WorkspaceRouteModal title={t(locale, "project.notFound")}><ProjectNotFound locale={locale} /></WorkspaceRouteModal>
  return <WorkspaceRouteModal title={project.name}>
    <ProjectWorkspace project={project} today={today} user={user} locale={locale} organizations={organizations} />
  </WorkspaceRouteModal>
}
