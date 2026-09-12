import { AppHeader } from "@/components/layout/app-header"
import { AccountSettings } from "@/features/account/account-settings"
import { getCurrentUser } from "@/lib/api/users"

export default async function AccountPage() {
  const user = await getCurrentUser()

  return (
    <div className="flex flex-col">
      <AppHeader title="حساب کاربری" />
      <div className="p-4">
        <AccountSettings user={user} />
      </div>
    </div>
  )
}
