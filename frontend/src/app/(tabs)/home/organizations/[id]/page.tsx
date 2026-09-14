import { PageHeader } from "@/components/navigation/page-header"
import { OrganizationOverview } from "@/features/organizations/organization-overview"
import { t } from "@/lib/i18n/dictionary"
import { getLocale } from "@/lib/i18n/server"
import { getOrganization } from "@/lib/api/organizations"

export default async function OrganizationOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [organization, locale] = await Promise.all([getOrganization(id), getLocale()])

  if (!organization) {
    return (
      <div className="p-4">
        <p className="text-sm text-text2">{t(locale, "org.notFound")}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title={organization.name}
        subtitle={`${organization.taskCount} ${t(locale, "org.taskCountSuffix")}`}
        menu={[
          [{ label: t(locale, "org.settings"), icon: "settings-3-line" }],
          [{ label: t(locale, "org.delete"), icon: "delete-bin-line", destructive: true }],
        ]}
      />
      <div className="p-4">
        <OrganizationOverview organization={organization} />
      </div>
    </div>
  )
}
