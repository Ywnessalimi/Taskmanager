import { BottomTabBar } from "@/components/navigation/bottom-tab-bar"
import { SidebarNav } from "@/components/navigation/sidebar-nav"

/**
 * از breakpoint `lg` (≥1024px) به بالا، `SidebarNav` جایگزین `BottomTabBar` می‌شود و محتوا
 * در یک ستون با عرض محدود (`max-w-[1200px]`) وسط‌چین می‌شود — به‌جای اینکه همان چیدمان
 * موبایل صرفاً کش بیاید. رجوع به docs/DESIGN.md بخش ۸.
 */
export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row lg:min-h-screen">
      <SidebarNav />
      <main className="min-w-0 flex-1 pb-14 lg:pb-0">
        <div className="mx-auto w-full lg:max-w-[1200px]">{children}</div>
      </main>
      <BottomTabBar />
    </div>
  )
}
