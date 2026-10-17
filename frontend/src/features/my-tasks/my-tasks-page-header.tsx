"use client"

import { PageHeader } from "@/components/navigation/page-header"
import { useTaskPanel } from "@/components/providers/task-panel-provider"
import { useT } from "@/components/providers/locale-provider"

/** هدر مسیر تجمیعی تسک‌ها؛ ظاهر PageHeader پروژه را حفظ می‌کند و ساخت تسک را باز می‌کند. */
export function MyTasksPageHeader() {
  const panel = useTaskPanel()
  const t = useT()

  return (
    <PageHeader
      title={t("myTasks.title")}
      subtitle={t("projects.all")}
      menu={[[{ label: t("project.addTask"), icon: "task-line", onClick: () => panel?.openNewTask() }]]}
    />
  )
}
