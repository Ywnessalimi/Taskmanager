import { ProjectNavigator } from "@/features/projects/project-navigator"
import { OrganizationProjectTree } from "@/features/projects/organization-project-tree"
import { getOrganizations } from "@/lib/api/organizations"
import { getCurrentUser } from "@/lib/api/users"
import { getLocale } from "@/lib/i18n/server"

export default async function ProjectsPage() {
  const [organizations, currentUser, locale] = await Promise.all([getOrganizations(), getCurrentUser(), getLocale()])
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background lg:flex-row">
      <ProjectNavigator organizations={organizations} locale={locale} userId={currentUser.id} />
      <OrganizationProjectTree organizations={organizations} user={currentUser} />
    </div>
  )
}
