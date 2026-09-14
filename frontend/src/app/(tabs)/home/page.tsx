import { AppHeader } from "@/components/layout/app-header"
import { AddTaskFab } from "@/components/navigation/add-task-fab"
import { Button } from "@/components/ui/button"
import { RemixIcon } from "@/components/ui/remix-icon"
import { WorkspaceList } from "@/features/home/workspace-list"
import { t } from "@/lib/i18n/dictionary"
import { getLocale } from "@/lib/i18n/server"
import { getOrganizations } from "@/lib/api/organizations"

export default async function HomePage() {
  const [organizations, locale] = await Promise.all([getOrganizations(), getLocale()])

  return (
    <div className="flex flex-col">
      <AppHeader
        title={t(locale, "home.title")}
        action={
          <Button variant="ghost" size="icon" aria-label={t(locale, "home.addWorkspace")}>
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
