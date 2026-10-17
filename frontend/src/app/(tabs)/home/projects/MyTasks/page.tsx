import { RemixIcon } from "@/components/ui/remix-icon"
import { ProjectNavigator } from "@/features/projects/project-navigator"
import { ProjectSectionTabs } from "@/features/projects/project-section-tabs"
import { MyTasksOverview } from "@/features/my-tasks/my-tasks-overview"
import { MyTasksPageHeader } from "@/features/my-tasks/my-tasks-page-header"
import { getMyTasks, getMyTasksOverview } from "@/lib/api/my-tasks"
import { getOrganizations } from "@/lib/api/organizations"
import { getToday } from "@/lib/api/calendar"
import { getCurrentUser } from "@/lib/api/users"
import { getLocale } from "@/lib/i18n/server"

/** نمای تجمعی کاربر در محیط پروژه‌ها؛ از نظر پوسته و نماها با صفحهٔ یک پروژه مشترک است. */
export default async function MyTasksProjectPage() {
  const [organizations, tasks, today, user, overview, locale] = await Promise.all([
    getOrganizations(),
    getMyTasks(),
    getToday(),
    getCurrentUser(),
    getMyTasksOverview(),
    getLocale(),
  ])

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background lg:flex-row">
      <ProjectNavigator organizations={organizations} activeId="MyTasks" locale={locale} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border px-4 lg:hidden">
          <span className="text-base font-semibold">{user.name}</span>
          <RemixIcon name="search-2-line" className="text-xl" />
        </header>
        <div className="hidden lg:block">
          <MyTasksPageHeader />
        </div>

        <ProjectSectionTabs
          tasks={tasks}
          ticketAssignees={Array.from(new Map(organizations.flatMap((organization) => organization.members).map((member) => [member.id, member])).values())}
          today={today}
          currentUserName={user.name}
          overviewContent={<MyTasksOverview user={user} overview={overview} />}
        />
      </div>
    </div>
  )
}
