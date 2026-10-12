import { ChatPage } from "@/features/pages/chat-page"
import { getCurrentUser } from "@/lib/api/users"
import { getLocale } from "@/lib/i18n/server"
import { t } from "@/lib/i18n/dictionary"
export default async function MessagesPage(){const [user,locale]=await Promise.all([getCurrentUser(),getLocale()]);return <section className="p-4"><h1 className="text-lg font-medium">{t(locale,"nav.messages")}</h1><ChatPage currentUserName={user.name} currentUserAvatarUrl={user.avatarUrl} /></section>}
