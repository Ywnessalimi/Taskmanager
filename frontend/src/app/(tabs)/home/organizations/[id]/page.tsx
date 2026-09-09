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
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-base font-medium text-foreground">{organization.name}</h1>
        <span className="text-xs text-text2">{organization.taskCount} تسک</span>
      </header>
      <OrganizationOverview organization={organization} />
    </div>
  )
}
