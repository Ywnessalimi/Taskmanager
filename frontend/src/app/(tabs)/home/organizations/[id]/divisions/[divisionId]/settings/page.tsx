import { DivisionSettingsPage } from "@/features/organizations/division-settings-page"
import { getOrganization } from "@/lib/api/organizations"
import { getLocale } from "@/lib/i18n/server"
import { t } from "@/lib/i18n/dictionary"

export default async function DivisionSettingsRoute({ params }: { params: Promise<{ id: string; divisionId: string }> }) {
  const { id, divisionId } = await params
  const [organization, locale] = await Promise.all([getOrganization(id), getLocale()])
  const division = organization?.divisions.find((item) => item.id === divisionId)

  if (!organization || !division) {
    return <div className="p-4"><p className="text-sm text-text2">{t(locale, "org.notFound")}</p></div>
  }

  return <DivisionSettingsPage organization={organization} division={division} />
}
