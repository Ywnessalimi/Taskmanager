import { PageHeader } from "@/components/navigation/page-header"
import { SessionsList } from "@/features/account/sessions-list"
import { getLocale } from "@/lib/i18n/server"
import { t } from "@/lib/i18n/dictionary"

export default async function AccountSessionsPage() {
  const locale = await getLocale()

  return (
    <div className="flex flex-1 flex-col bg-bg2">
      <PageHeader title={t(locale, "account.sessionsTitle")} />
      <div className="p-4">
        <SessionsList />
      </div>
    </div>
  )
}
