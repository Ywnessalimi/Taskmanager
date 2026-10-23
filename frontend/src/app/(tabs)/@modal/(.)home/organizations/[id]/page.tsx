import { WorkspaceRouteModal } from "@/components/ui/workspace-route-modal"
import { OrganizationOverview } from "@/features/organizations/organization-overview"
import { getOrganization } from "@/lib/api/organizations"
import { getLocale } from "@/lib/i18n/server"
import { t } from "@/lib/i18n/dictionary"

export default async function DivisionDetailsModal({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ divisionId?: string }>
}) {
  const [{ id }, { divisionId }] = await Promise.all([params, searchParams])
  const [organization, locale] = await Promise.all([getOrganization(id), getLocale()])
  if (!organization) return <WorkspaceRouteModal title={t(locale, "org.notFound")}><p className="p-4 text-sm text-text2">{t(locale, "org.notFound")}</p></WorkspaceRouteModal>

  const selectedDivision = organization.divisions.find((division) => division.id === divisionId)
  return <WorkspaceRouteModal title={selectedDivision?.name ?? organization.name} showHeader={false}>
    <OrganizationOverview organization={organization} initialDivisionId={divisionId} modal />
  </WorkspaceRouteModal>
}
