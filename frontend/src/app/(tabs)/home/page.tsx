import { AddTaskFab } from "@/components/navigation/add-task-fab"
import { HomeGreeting } from "@/features/home/home-greeting"
import { WorkspaceList } from "@/features/home/workspace-list"
import { t } from "@/lib/i18n/dictionary"
import { getLocale } from "@/lib/i18n/server"
import { getMyTasks } from "@/lib/api/my-tasks"
import { getOrganizations } from "@/lib/api/organizations"
import { getCurrentUser } from "@/lib/api/users"

export default async function HomePage() {
  const [organizations, myTasks, currentUser, locale] = await Promise.all([
    getOrganizations(),
    getMyTasks(),
    getCurrentUser(),
    getLocale(),
  ])

  return (
    <div className="flex flex-col">
      <HomeGreeting locale={locale} userName={currentUser.name} inProgressCount={myTasks.length} />
      <div className="flex flex-col gap-3 p-4">
        <p className="text-end text-sm text-foreground">{t(locale, "home.orgsAndProjects")}</p>
        <div className="rounded-md border border-border bg-background px-3">
          <WorkspaceList organizations={organizations} />
        </div>
      </div>
      <AddTaskFab />
    </div>
  )
}
