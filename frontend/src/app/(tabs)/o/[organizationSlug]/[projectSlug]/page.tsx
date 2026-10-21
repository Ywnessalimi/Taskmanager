import { ProjectPageHeader } from "@/features/projects/project-page-header"
import { ProjectSectionTabs } from "@/features/projects/project-section-tabs"
import { ProjectNavigator } from "@/features/projects/project-navigator"
import { getLocale } from "@/lib/i18n/server"
import { t } from "@/lib/i18n/dictionary"
import { getToday } from "@/lib/api/calendar"
import { getProjectBySlugs } from "@/lib/api/projects"
import { getOrganizations } from "@/lib/api/organizations"
import { getCurrentUser } from "@/lib/api/users"
import { RemixIcon } from "@/components/ui/remix-icon"

export default async function ProjectSlugPage({ params }: { params: Promise<{ organizationSlug: string; projectSlug: string }> }) {
  const { organizationSlug, projectSlug } = await params
  const [project, today, user, locale, organizations] = await Promise.all([
    getProjectBySlugs(organizationSlug, projectSlug),
    getToday(),
    getCurrentUser(),
    getLocale(),
    getOrganizations(),
  ])

  if (!project) return <div className="p-4"><p className="text-sm text-text2">{t(locale, "project.notFound")}</p></div>
  const currentMembership = project.members.find((member) => member.id === user.id)
  const isAdmin = currentMembership?.role === "owner" || currentMembership?.permissions?.editProject === true

  return <div className="flex min-h-0 flex-1 flex-col bg-background lg:flex-row">
    <ProjectNavigator organizations={organizations} activeId={project.id} locale={locale} userId={user.id} />
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-14 items-center justify-between border-b border-border px-4 lg:hidden"><span className="text-base font-semibold">{user.name}</span><RemixIcon name="search-2-line" className="text-xl" /></header>
      <div className="hidden lg:block"><ProjectPageHeader title={project.name} subtitle={project.organizationName} projectId={project.id} currentUserId={user.id} isAdmin={isAdmin} organizations={organizations} /></div>
      <ProjectSectionTabs currentUserName={user.name} project={project} today={today} />
    </div>
  </div>
}
