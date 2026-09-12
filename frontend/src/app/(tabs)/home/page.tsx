import { AppHeader } from "@/components/layout/app-header"
import { AddTaskFab } from "@/components/navigation/add-task-fab"
import { Button } from "@/components/ui/button"
import { RemixIcon } from "@/components/ui/remix-icon"
import { WorkspaceList } from "@/features/home/workspace-list"
import { getOrganizations } from "@/lib/api/organizations"

export default async function HomePage() {
  const organizations = await getOrganizations()

  return (
    <div className="flex flex-col">
      <AppHeader
        title="خانه"
        action={
          <Button variant="ghost" size="icon" aria-label="افزودن Workspace جدید">
            <RemixIcon name="add-line" className="text-base" />
          </Button>
        }
      />
      <div className="p-4">
        <div className="rounded-md border border-border bg-background px-3">
          <WorkspaceList organizations={organizations} />
        </div>
      </div>
      <AddTaskFab />
    </div>
  )
}
