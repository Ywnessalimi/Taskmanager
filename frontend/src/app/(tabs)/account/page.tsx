import { AppHeader } from "@/components/layout/app-header"
import { AccountSettings } from "@/features/account/account-settings"
import { t } from "@/lib/i18n/dictionary"
import { getLocale } from "@/lib/i18n/server"
import { getCurrentUser } from "@/lib/api/users"

export default async function AccountPage() {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()])

  return (
    <div className="flex flex-col">
      <AppHeader title={t(locale, "account.title")} />
      <div className="p-4">
        <AccountSettings user={user} />
      </div>
    </div>
  )
}
