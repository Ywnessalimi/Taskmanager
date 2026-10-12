"use client"

import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/navigation/page-header"
import { useTaskPanel } from "@/components/providers/task-panel-provider"
import { useT } from "@/components/providers/locale-provider"

/** هدر پروژه و اکشن‌های آن؛ مودال تسک روی محتوا باز می‌شود. */
export function ProjectPageHeader({
  title,
  subtitle,
  projectId,
  isAdmin,
}: {
  title: string
  subtitle?: string
  projectId: string
  /** فقط ادمین‌های همان سازمان اجازه‌ی حذف پروژه را دارند — رجوع به `page.tsx` (تطبیق نام کاربر جاری با نقشش در `project.members`). */
  isAdmin: boolean
}) {
  const panel = useTaskPanel()
  const router = useRouter()
  const t = useT()

  return (
    <div>
      <PageHeader
        title={title}
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
