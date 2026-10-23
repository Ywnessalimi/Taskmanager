import { WorkspaceRouteModal } from "@/components/ui/workspace-route-modal"
import { OrganizationOverview } from "@/features/organizations/organization-overview"
import { getOrganizationBySlug } from "@/lib/api/organizations"
import { getLocale } from "@/lib/i18n/server"
import { t } from "@/lib/i18n/dictionary"

export default async function OrganizationDetailsModal({ params, searchParams }: {
  params: Promise<{ organizationSlug: string }>
  searchParams: Promise<{ divisionId?: string }>
}) {
  const [{ organizationSlug }, { divisionId }] = await Promise.all([params, searchParams])
  const [organization, locale] = await Promise.all([getOrganizationBySlug(organizationSlug), getLocale()])
  if (!organization) return <WorkspaceRouteModal title={t(locale, "org.notFound")}><p className="p-4 text-sm text-text2">{t(locale, "org.notFound")}</p></WorkspaceRouteModal>

  return <WorkspaceRouteModal title={organization.name} showHeader={false}>
    <OrganizationOverview organization={organization} initialDivisionId={divisionId} modal />
  </WorkspaceRouteModal>
}
