import { BottomTabBar } from "@/components/navigation/bottom-tab-bar"
import { DesktopHeader } from "@/components/navigation/desktop-header"
import { SidebarNav } from "@/components/navigation/sidebar-nav"
import { getNotifications } from "@/lib/api/notifications"
import { getOrganizations } from "@/lib/api/organizations"
import { getTaskFormOptions } from "@/lib/api/tasks"
import { getCurrentUser } from "@/lib/api/users"

/**
 * از breakpoint `lg` (≥1024px) به بالا، `SidebarNav` جایگزین `BottomTabBar` می‌شود و یک
 * `DesktopHeader` مستقل (نه بخشی از ساید‌بار) دقیقاً بالای محتوای اصلی می‌نشیند؛ محتوا هم
 * در یک ستون با عرض محدود (`max-w-[1200px]`) وسط‌چین می‌شود — به‌جای اینکه همان چیدمان
 * موبایل صرفاً کش بیاید. رجوع به docs/DESIGN.md بخش ۸.۱.
 *
 * سازمان‌ها/اعلان‌ها/کاربر واردشده/گزینه‌های فرم تسک اینجا (Server Component) واکشی می‌شوند
 * تا `SidebarNav` بتواند `WorkspaceList` صفحه‌ی خانه را مستقیم نشان دهد و `DesktopHeader`
 * بتواند اواتار، خلاصه‌ی اعلان‌های خوانده‌نشده، و پنل «تسک جدید» (`NewTaskDialog`) را نمایش دهد.
 */
export default async function TabsLayout({ children }: { children: React.ReactNode }) {
  const [organizations, notifications, currentUser, taskFormProjects] = await Promise.all([
    getOrganizations(),
    getNotifications(),
    getCurrentUser(),
    getTaskFormOptions(),
  ])

  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row lg:min-h-screen">
      <SidebarNav organizations={organizations} />
      <main className="min-w-0 flex-1 pb-14 lg:pb-0">
        <div className="mx-auto w-full lg:max-w-[1200px]">
          <DesktopHeader currentUser={currentUser} notifications={notifications} taskFormProjects={taskFormProjects} />
          {children}
        </div>
      </main>
      <BottomTabBar />
    </div>
  )
}
