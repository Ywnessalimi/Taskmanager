"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useT } from "@/components/providers/locale-provider"
import { ALL_PROJECTS, useMyTasksFilter } from "./my-tasks-filter-provider"

/**
 * جایگزین ردیف دکمه‌های افقی قبلی (یکی به‌ازای هر پروژه) کنار عنوان «تسک‌های من» در
 * `AppHeader` — بدون استایل خاص، فقط متن پروژه‌ی انتخاب‌شده و آیکون دراپ‌داون در سمت
 * چپش (چون در RTL، آخرین آیتم ردیف flex در سمت چپ می‌نشیند).
 */
export function MyTasksProjectSwitcher() {
  const { projectId, setProjectId, projects } = useMyTasksFilter()
  const t = useT()

  const options = [{ id: ALL_PROJECTS, name: t("myTasks.allProjects") }, ...projects]
  const current = options.find((project) => project.id === projectId) ?? options[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex shrink-0 items-center gap-1 text-sm text-text2 hover:text-foreground">
        {current.name}
        <RemixIcon name="arrow-down-s-line" className="text-base" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((project) => (
          <DropdownMenuItem key={project.id} onClick={() => setProjectId(project.id)}>
            {project.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
