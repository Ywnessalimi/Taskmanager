import { PageHeader } from "@/components/navigation/page-header"
import { UserProfile } from "@/features/users/user-profile"
import { t } from "@/lib/i18n/dictionary"
import { getLocale } from "@/lib/i18n/server"
import { getUserById } from "@/lib/api/users"

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [user, locale] = await Promise.all([getUserById(id), getLocale()])

  if (!user) {
    return (
      <div className="p-4">
        <p className="text-sm text-text2">{t(locale, "user.notFound")}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <PageHeader title={user.name} />
      <div className="p-4">
        <UserProfile user={user} />
      </div>
    </div>
  )
}
