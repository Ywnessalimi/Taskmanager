import { OrganizationMemberPermissionsPage } from "@/features/organizations/organization-member-permissions-page"
import { getOrganization } from "@/lib/api/organizations"
import { getCurrentUser } from "@/lib/api/users"
import { getLocale } from "@/lib/i18n/server"
import { t } from "@/lib/i18n/dictionary"

export default async function OrganizationMemberPermissionsRoute({ params }: { params: Promise<{ id: string; memberId: string }> }) {
  const { id, memberId } = await params
  const [organization, user, locale] = await Promise.all([getOrganization(id), getCurrentUser(), getLocale()])
  const canManageAccess = organization?.currentUserRole === "owner"
    || organization?.currentUserRole === "admin"
    || organization?.currentUserPermissions?.manageAccess === true
  const member = organization?.members.find((entry) => entry.id === memberId)
  if (!organization || !canManageAccess || !member || member.role === "owner" && user.id !== member.id) {
    return <div className="p-4"><p className="text-sm text-text2">{t(locale, "org.notFound")}</p></div>
  }
  return <div className="flex min-h-0 flex-1 flex-col bg-background">
    <header className="border-b border-border px-5 py-4 lg:px-10"><h1 className="text-xl font-semibold text-foreground">{t(locale, "orgSettings.title")}</h1></header>
    <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-5 py-6 md:gap-12 lg:px-10 lg:py-8">
      <OrganizationMemberPermissionsPage organization={organization} member={member} />
    </div>
  </div>
}
