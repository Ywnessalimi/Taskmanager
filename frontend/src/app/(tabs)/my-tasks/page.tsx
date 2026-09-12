import { AppHeader } from "@/components/layout/app-header"
import { AddTaskFab } from "@/components/navigation/add-task-fab"
import { SectionTabs } from "@/features/pages/section-tabs"
import { MyTaskList } from "@/features/my-tasks/my-task-list"
import { MyTasksOverview } from "@/features/my-tasks/my-tasks-overview"
import { getToday } from "@/lib/api/calendar"
import { getMyTasks, getMyTasksOverview } from "@/lib/api/my-tasks"
import { getCurrentUser } from "@/lib/api/users"

export default async function MyTasksPage() {
  const [user, tasks, today, overview] = await Promise.all([
    getCurrentUser(),
    getMyTasks(),
    getToday(),
    getMyTasksOverview(),
  ])

  return (
    <div className="flex flex-col">
      <AppHeader title="تسک‌های من" />
      <SectionTabs
        currentUserName={user.name}
        listContent={<MyTaskList tasks={tasks} today={today} />}
        overviewContent={<MyTasksOverview user={user} overview={overview} />}
      />
      <AddTaskFab />
    </div>
  )
}
