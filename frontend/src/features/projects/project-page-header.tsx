"use client"

import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/navigation/page-header"
import { useTaskPanel } from "@/components/providers/task-panel-provider"
import { useT } from "@/components/providers/locale-provider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RemixIcon } from "@/components/ui/remix-icon"
import type { Organization } from "@/lib/api/types"
import { projectPath } from "@/lib/organization-paths"

/** هدر پروژه و اکشن‌های آن؛ مودال تسک روی محتوا باز می‌شود. */
export function ProjectPageHeader({
  title,
  subtitle,
  projectId,
  currentUserId,
  isAdmin,
  organizations,
}: {
  title: string
  subtitle?: string
  projectId: string
  currentUserId: string
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
        {organizations.flatMap((organization) => organization.divisions.flatMap((division) => division.projects.map((project) => ({ project, organization }))))
          .filter(({ project }) => project.memberIds.includes(currentUserId))
          .map(({ project, organization }) => (
            <DropdownMenuItem key={project.id} onClick={() => router.push(projectPath({ ...project, organizationSlug: organization.slug }))} className="whitespace-nowrap">
              <span className="truncate">{project.name}</span>
            </DropdownMenuItem>
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
        showBackButton={false}
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
