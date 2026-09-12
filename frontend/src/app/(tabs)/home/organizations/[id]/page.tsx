import { PageHeader } from "@/components/navigation/page-header"
import { OrganizationOverview } from "@/features/organizations/organization-overview"
import { getOrganization } from "@/lib/api/organizations"

export default async function OrganizationOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const organization = await getOrganization(id)

  if (!organization) {
    return (
      <div className="p-4">
        <p className="text-sm text-text2">سازمانی با این شناسه پیدا نشد.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title={organization.name}
        subtitle={`${organization.taskCount} تسک`}
        menu={[
          [{ label: "تنظیمات سازمان", icon: "settings-3-line" }],
          [{ label: "حذف سازمان", icon: "delete-bin-line", destructive: true }],
        ]}
      />
      <div className="p-4">
        <OrganizationOverview organization={organization} />
      </div>
    </div>
  )
}
