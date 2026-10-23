import { redirect } from "next/navigation"
import { ProjectWorkspace, ProjectNotFound } from "@/features/projects/project-workspace"
import { getLocale } from "@/lib/i18n/server"
import { getToday } from "@/lib/api/calendar"
import { getProject } from "@/lib/api/projects"
import { getOrganizations } from "@/lib/api/organizations"
import { getCurrentUser } from "@/lib/api/users"

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [project, today, user, locale, organizations] = await Promise.all([
    getProject(id),
    getToday(),
    getCurrentUser(),
    getLocale(),
    getOrganizations(),
  ])

  if (!project) return <ProjectNotFound locale={locale} />

  if (project.slug && project.organizationSlug) redirect(`/o/${encodeURIComponent(project.organizationSlug)}/${encodeURIComponent(project.slug)}`)
  return <ProjectWorkspace project={project} today={today} user={user} locale={locale} organizations={organizations} />
}
