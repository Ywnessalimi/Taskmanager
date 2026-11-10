import { OrganizationSettingsPage } from "@/features/organizations/organization-settings-page"
import { OrganizationOverview } from "@/features/organizations/organization-overview"
import { getOrganization } from "@/lib/api/organizations"
import { getCurrentUser } from "@/lib/api/users"
import { getLocale } from "@/lib/i18n/server"
import { t } from "@/lib/i18n/dictionary"

export default async function OrganizationSettingsRoute({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ divisionId?: string }> }) {
  const [{ id }, { divisionId }] = await Promise.all([params, searchParams])
  const [organization, user, locale] = await Promise.all([getOrganization(id), getCurrentUser(), getLocale()])

  if (!organization) {
    return <div className="p-4"><p className="text-sm text-text2">{t(locale, "org.notFound")}</p></div>
  }

  const selectedDivision = divisionId && organization.divisions.find((division) => division.id === divisionId)
  if (selectedDivision) {
    const overviewPath = organization.slug ? `/o/${encodeURIComponent(organization.slug)}` : `/home/organizations/${encodeURIComponent(organization.id)}`
    const overviewHref = `${overviewPath}?divisionId=${encodeURIComponent(selectedDivision.id)}`
    return <div className="flex min-h-0 flex-1 flex-col bg-background"><div className="flex min-h-0 flex-1 p-0 lg:p-4"><OrganizationOverview organization={organization} initialDivisionId={selectedDivision.id} initialTab="settings" closeHref={overviewHref} settingsContent={<OrganizationSettingsPage organization={organization} user={user} embedded />} /></div></div>
  }

  return <OrganizationSettingsPage organization={organization} user={user} />
}
