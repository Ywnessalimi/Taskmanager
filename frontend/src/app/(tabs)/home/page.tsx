import { Button } from "@/components/ui/button"
import { RemixIcon } from "@/components/ui/remix-icon"
import { WorkspaceList } from "@/features/home/workspace-list"
import { getOrganizations } from "@/lib/api/organizations"

export default async function HomePage() {
  const organizations = await getOrganizations()

  return (
    <div className="flex flex-col p-4">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-base font-medium text-foreground">خانه</h1>
        <Button variant="ghost" size="icon" aria-label="افزودن Workspace جدید">
          <RemixIcon name="add-line" className="text-base" />
        </Button>
      </div>
      <WorkspaceList organizations={organizations} />
    </div>
  )
}
