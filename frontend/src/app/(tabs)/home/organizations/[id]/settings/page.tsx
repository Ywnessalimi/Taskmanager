import { OrganizationSettingsPage } from "@/features/organizations/organization-settings-page"
import { getOrganization } from "@/lib/api/organizations"
import { getCurrentUser } from "@/lib/api/users"
import { getLocale } from "@/lib/i18n/server"
import { t } from "@/lib/i18n/dictionary"

export default async function OrganizationSettingsRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [organization, user, locale] = await Promise.all([getOrganization(id), getCurrentUser(), getLocale()])

  if (!organization) {
    return <div className="p-4"><p className="text-sm text-text2">{t(locale, "org.notFound")}</p></div>
  }

  return <OrganizationSettingsPage organization={organization} user={user} />
}
