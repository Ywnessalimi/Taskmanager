import Image from "next/image"
import Link from "next/link"
import { RemixIcon } from "@/components/ui/remix-icon"
import type { Organization } from "@/lib/api/types"
import { t, type Locale } from "@/lib/i18n/dictionary"

/** فهرست همهٔ پروژه‌ها در محیط مستقل پروژه‌ها، کنار پروژهٔ انتخاب‌شده. */
export function ProjectNavigator({ organizations, activeId, locale }: { organizations: Organization[]; activeId?: string; locale: Locale }) {
  const activeProject = organizations.flatMap((organization) => organization.projects).find((project) => project.id === activeId)
  return (
    <>
    <details className="relative border-b border-border bg-background px-4 py-3 lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium"><span>{activeProject?.name ?? t(locale, "projects.all")}</span><RemixIcon name="arrow-down-s-line" className="text-lg" /></summary>
      <nav aria-label={t(locale, "projects.all")} className="absolute inset-x-3 top-full z-40 max-h-64 overflow-y-auto rounded-xl border border-border bg-background p-2">
        <Link href="/projects" className="block rounded-md px-3 py-2 text-sm">{t(locale, "projects.all")}</Link>
        {organizations.map((organization) => <div key={organization.id} className="py-2">
          <p className="px-3 text-sm font-medium">{organization.name}</p>
          {organization.divisions.map((division) => <div key={division.id} className="ps-3"><p className="px-3 py-1 text-xs text-text3">{division.name}</p>{division.projects.map((project) => <Link key={project.id} href={`/home/projects/${project.id}`} className="block rounded-md px-3 py-2 text-sm hover:bg-bg2">{project.name}</Link>)}</div>)}
        </div>)}
      </nav>
    </details>
    <aside className="hidden w-52 shrink-0 flex-col border-e border-border bg-[var(--project-surface)] lg:flex">
      <nav className="flex h-[78px] flex-col justify-center gap-3 border-b border-border px-4">
        {[{href:"/my-tasks",label:"nav.myTasks",icon:"tasks"},{href:"/notifications",label:"projectNav.notifications",icon:"notifications"},{href:"/messages",label:"nav.messages",icon:"messages"}].map(item => <Link key={item.href} href={item.href} className="flex items-center gap-2 px-1 text-xs leading-normal font-medium text-[#595959] hover:text-foreground"><Image src={`/images/figma/project-navigation/${item.icon}.svg`} width={16} height={16} alt="" />{t(locale,item.label as "nav.myTasks")}</Link>)}
      </nav>
      <nav aria-label={t(locale, "projects.all")} className="flex flex-col gap-4 overflow-y-auto p-3">
        {organizations.map((organization) => (
          <div key={organization.id} className="flex flex-col gap-1">
            <p className="px-2 text-xs font-medium text-text3">{organization.name}</p>
            {organization.divisions.map((division) => (
            <details key={division.id} open className="ps-2">
              <summary className="cursor-pointer py-1 text-xs text-text2">{division.name}</summary>
              <div className="ps-2">{division.projects.map((project) => (
              <Link key={project.id} href={`/home/projects/${project.id}`} aria-current={project.id === activeId ? "page" : undefined} className={`flex min-h-8 items-center gap-2 rounded-md px-2 text-sm ${project.id === activeId ? "bg-background font-semibold text-foreground" : "text-text2 hover:bg-background"}`}>
                <RemixIcon name="list-check-2" className="text-base" />
                <span className="truncate">{project.name}</span>
              </Link>
            ))}</div>
            </details>
            ))}
          </div>
        ))}
      </nav>
    </aside>
    </>
  )
}
