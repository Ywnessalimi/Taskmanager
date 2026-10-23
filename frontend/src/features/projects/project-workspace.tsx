import { ProjectPageHeader } from "@/features/projects/project-page-header"
import { ProjectSectionTabs } from "@/features/projects/project-section-tabs"
import { ProjectNavigator } from "@/features/projects/project-navigator"
import { t, type Locale } from "@/lib/i18n/dictionary"
import { RemixIcon } from "@/components/ui/remix-icon"
import type { CurrentUser, Organization, Project } from "@/lib/api/types"

/** Shared project layout for direct routes and intercepted taskWorkspace modals. */
export function ProjectWorkspace({ project, today, user, locale, organizations }: {
  project: Project
  today: string
  user: CurrentUser
  locale: Locale
  organizations: Organization[]
}) {
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

export function ProjectNotFound({ locale }: { locale: Locale }) {
  return <div className="p-4"><p className="text-sm text-text2">{t(locale, "project.notFound")}</p></div>
}
