import { BottomTabBar } from "@/components/navigation/bottom-tab-bar"
import { DesktopHeader } from "@/components/navigation/desktop-header"
import { SidebarNav } from "@/components/navigation/sidebar-nav"
import { TaskPanelProvider } from "@/components/providers/task-panel-provider"
import { getNotifications } from "@/lib/api/notifications"
import { getTaskFormOptions } from "@/lib/api/tasks"
import { getCurrentUser } from "@/lib/api/users"

/**
 * مینی‌بار در موبایل پایین و از `lg` به بالا کنار محتواست؛ با RTL/LTR محل افقی آن
 * خودکار تغییر می‌کند. اعلان‌ها، کاربر و گزینه‌های تسک برای هدر و پنل واکشی می‌شوند.
 */
export default async function TabsLayout({ children }: { children: React.ReactNode }) {
  const [notifications, currentUser, taskFormProjects] = await Promise.all([
    getNotifications(),
    getCurrentUser(),
    getTaskFormOptions(),
  ])

  return (
    <TaskPanelProvider projects={taskFormProjects} user={currentUser}>
      <div className="flex min-h-full flex-1 flex-col lg:flex-row lg:min-h-screen">
        <SidebarNav />
        <main className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
          <div className="flex w-full flex-1 flex-col">
            <DesktopHeader currentUser={currentUser} notifications={notifications} projects={taskFormProjects} />
            {children}
          </div>
        </main>
        <BottomTabBar />
      </div>
    </TaskPanelProvider>
  )
}
