import { ProjectWorkspace, ProjectNotFound } from "@/features/projects/project-workspace"
import { getLocale } from "@/lib/i18n/server"
import { getToday } from "@/lib/api/calendar"
import { getProjectBySlugs } from "@/lib/api/projects"
import { getOrganizations } from "@/lib/api/organizations"
import { getCurrentUser } from "@/lib/api/users"

export default async function ProjectSlugPage({ params }: { params: Promise<{ organizationSlug: string; projectSlug: string }> }) {
  const { organizationSlug, projectSlug } = await params
  const [project, today, user, locale, organizations] = await Promise.all([
    getProjectBySlugs(organizationSlug, projectSlug),
    getToday(),
    getCurrentUser(),
    getLocale(),
    getOrganizations(),
  ])

  if (!project) return <ProjectNotFound locale={locale} />
  return <ProjectWorkspace project={project} today={today} user={user} locale={locale} organizations={organizations} />
}
