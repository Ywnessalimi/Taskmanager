import { BottomTabBar } from "@/components/navigation/bottom-tab-bar"

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="flex-1 pb-14">{children}</main>
      <BottomTabBar />
    </div>
  )
}
