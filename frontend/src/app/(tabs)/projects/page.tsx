import Link from "next/link"
import { RemixIcon } from "@/components/ui/remix-icon"
import { ProjectNavigator } from "@/features/projects/project-navigator"
import { getOrganizations } from "@/lib/api/organizations"
import { t } from "@/lib/i18n/dictionary"
import { getLocale } from "@/lib/i18n/server"

export default async function ProjectsPage() {
  const [organizations, locale] = await Promise.all([getOrganizations(), getLocale()])
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background lg:flex-row">
      <ProjectNavigator organizations={organizations} locale={locale} />
      <div className="flex min-w-0 flex-1 flex-col p-4 lg:p-6">
        <h1 className="mb-5 text-lg font-semibold text-foreground">{t(locale, "projects.all")}</h1>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {organizations.flatMap((organization) => organization.divisions.flatMap((division) => division.projects.map((project) => (
            <Link key={project.id} href={`/home/projects/${project.id}`} className="flex min-h-24 flex-col justify-between rounded-2xl border border-border bg-background p-4 hover:border-brand">
              <span className="flex items-center gap-2 text-sm font-medium"><RemixIcon name="dashboard-line" className="text-lg text-brand" />{project.name}</span>
              <span className="text-xs text-text3">{organization.name} / {division.name}</span>
            </Link>
          ))))}
        </div>
      </div>
    </div>
  )
}
