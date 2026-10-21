import { OrganizationPageHeader } from "@/features/organizations/organization-page-header"
import { OrganizationOverview } from "@/features/organizations/organization-overview"
import { getOrganizationBySlug } from "@/lib/api/organizations"
import { getLocale } from "@/lib/i18n/server"
import { t } from "@/lib/i18n/dictionary"

export default async function OrganizationSlugPage({ params, searchParams }: { params: Promise<{ organizationSlug: string }>; searchParams: Promise<{ divisionId?: string }> }) {
  const [{ organizationSlug }, { divisionId }] = await Promise.all([params, searchParams])
  const [organization, locale] = await Promise.all([getOrganizationBySlug(organizationSlug), getLocale()])
  if (!organization) return <div className="p-4"><p className="text-sm text-text2">{t(locale, "org.notFound")}</p></div>
  return <div className="flex flex-1 flex-col bg-background">
    <OrganizationPageHeader id={organization.id} name={organization.name} taskCount={organization.taskCount} />
    <div className="p-4"><OrganizationOverview organization={organization} initialDivisionId={divisionId} /></div>
  </div>
}
