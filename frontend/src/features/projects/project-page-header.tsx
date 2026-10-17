"use client"

import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/navigation/page-header"
import { useTaskPanel } from "@/components/providers/task-panel-provider"
import { useT } from "@/components/providers/locale-provider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RemixIcon } from "@/components/ui/remix-icon"
import type { Organization } from "@/lib/api/types"

/** هدر پروژه و اکشن‌های آن؛ مودال تسک روی محتوا باز می‌شود. */
export function ProjectPageHeader({
  title,
  subtitle,
  projectId,
  isAdmin,
  organizations,
}: {
  title: string
  subtitle?: string
  projectId: string
  organizations: Organization[]
  /** فقط ادمین‌های همان سازمان اجازه‌ی حذف پروژه را دارند — رجوع به `page.tsx` (تطبیق نام کاربر جاری با نقشش در `project.members`). */
  isAdmin: boolean
}) {
  const panel = useTaskPanel()
  const router = useRouter()
  const t = useT()
  const titleContent = (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex min-w-0 max-w-full items-center gap-1 text-start hover:text-text2">
        <span className="truncate">{title}</span>
        <RemixIcon name="arrow-down-s-line" className="shrink-0 text-lg text-text2" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[70vh] w-64 min-w-64 overflow-y-auto">
        <DropdownMenuItem onClick={() => router.push("/home/projects/MyTasks")} className="whitespace-nowrap">
          <RemixIcon name="stack-line" className="text-base" />
          {t("projects.all")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {organizations.map((organization) => (
          <div key={organization.id}>
            <p className="px-2 py-1.5 text-xs font-medium text-text3">{organization.name}</p>
            {organization.divisions.map((division) => (
              <div key={division.id}>
                <p className="px-2 py-1 text-xs text-text3">{division.name}</p>
                {division.projects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => router.push(`/home/projects/${project.id}`)}
                    className="whitespace-nowrap"
                  >
                    <span className="truncate">{project.name}</span>
                  </DropdownMenuItem>
                ))}
              </div>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div>
      <PageHeader
        title={title}
        titleContent={titleContent}
        subtitle={subtitle}
        menu={[
          [
            {
              label: t("project.addTask"),
              icon: "task-line",
              onClick: () => panel?.openNewTask(),
            },
          ],
          [
            {
              label: t("project.settings"),
              icon: "settings-3-line",
              onClick: () => router.push(`/home/projects/${projectId}/settings`),
            },
          ],
          ...(isAdmin
            ? [[{ label: t("project.delete"), icon: "delete-bin-line", destructive: true }]]
            : []),
        ]}
      />
    </div>
  )
}
