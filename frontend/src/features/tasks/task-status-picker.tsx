"use client"

import { useEffect, useState } from "react"
import { useT } from "@/components/providers/locale-provider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RemixIcon } from "@/components/ui/remix-icon"
import { PROJECT_BOARD_BASE_COLUMNS, readProjectBoardColumns, type StoredBoardColumn } from "@/features/projects/board-column-storage"
import type { TaskStatus } from "@/lib/api/types"

const BASE_LABEL_KEYS = {
  todo: "status.todo",
  "in-progress": "status.inProgress",
  completed: "status.completed",
  cancelled: "board.cancelled",
} as const

export function TaskStatusPicker({ projectId, projectName, selectedColumnId, onSelect }: {
  projectId: string
  projectName?: string
  selectedColumnId: string
  onSelect: (columnId: string, baseStatus?: TaskStatus) => void
}) {
  const t = useT()
  const [customColumns, setCustomColumns] = useState<StoredBoardColumn[]>([])

  useEffect(() => {
    const refresh = () => setCustomColumns(projectId ? readProjectBoardColumns(projectId) : [])
    refresh()
    window.addEventListener("quire:project-board-columns-changed", refresh)
    window.addEventListener("storage", refresh)
    return () => {
      window.removeEventListener("quire:project-board-columns-changed", refresh)
      window.removeEventListener("storage", refresh)
    }
  }, [projectId])

  const columns = [...PROJECT_BOARD_BASE_COLUMNS, ...customColumns]
  const selected = columns.find((column) => column.id === selectedColumnId) ?? columns[0]
  const label = (column: StoredBoardColumn) => column.id in BASE_LABEL_KEYS
    ? t(BASE_LABEL_KEYS[column.id as keyof typeof BASE_LABEL_KEYS])
    : column.label
  const icon = (column: StoredBoardColumn) => column.icon === "figma-progress" ? "play-circle-fill" : column.icon

  return <DropdownMenu>
    <DropdownMenuTrigger
      aria-label={`${t("newTask.status")}: ${label(selected)}`}
      title={`${t("newTask.status")}: ${label(selected)}`}
      className="grid size-8 shrink-0 place-items-center rounded-lg hover:bg-bg2"
    >
      <RemixIcon name={icon(selected)} className="text-xl leading-none" style={{ color: selected.color }} />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-60 p-1.5 shadow-none">
      <div className="border-b border-border px-2 py-2">
        <p className="text-xs font-semibold">{t("newTask.status")}</p>
        {projectName && <p className="mt-0.5 truncate text-xs text-text3">{projectName}</p>}
      </div>
      <div className="py-1">
        {columns.map((column) => <DropdownMenuItem
          key={column.id}
          onClick={() => onSelect(column.id, column.id === "todo" || column.id === "in-progress" || column.id === "completed" ? column.id : undefined)}
          className="flex min-h-9 gap-2 px-2"
        >
          <RemixIcon name={icon(column)} className="text-lg leading-none" style={{ color: column.color }} />
          <span className="min-w-0 flex-1 truncate">{label(column)}</span>
          {column.id === selectedColumnId && <RemixIcon name="check-line" className="text-brand" />}
        </DropdownMenuItem>)}
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
}
