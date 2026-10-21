import { redirect } from "next/navigation"
import { OrganizationPageHeader } from "@/features/organizations/organization-page-header"
import { OrganizationOverview } from "@/features/organizations/organization-overview"
import { t } from "@/lib/i18n/dictionary"
import { getLocale } from "@/lib/i18n/server"
import { getOrganization } from "@/lib/api/organizations"

export default async function OrganizationOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ divisionId?: string }>
}) {
  const [{ id }, { divisionId }] = await Promise.all([params, searchParams])
  const [organization, locale] = await Promise.all([getOrganization(id), getLocale()])

  if (!organization) {
    return (
      <div className="p-4">
        <p className="text-sm text-text2">{t(locale, "org.notFound")}</p>
      </div>
    )
  }

  if (organization.slug) redirect(`/o/${encodeURIComponent(organization.slug)}${divisionId ? `?divisionId=${encodeURIComponent(divisionId)}` : ""}`)

  return (
    <div className="flex flex-1 flex-col bg-background">
      <OrganizationPageHeader id={organization.id} name={organization.name} taskCount={organization.taskCount} />
      <div className="p-4">
        <OrganizationOverview organization={organization} initialDivisionId={divisionId} />
      </div>
    </div>
  )
}
