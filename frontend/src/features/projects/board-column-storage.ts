export type StoredBoardColumn = {
  id: string
  label: string
  color: string
  icon: string
}

/** ستون‌های ثابت Board پروژه؛ انتخابگر وضعیت جزئیات از همین قرارداد استفاده می‌کند. */
export const PROJECT_BOARD_BASE_COLUMNS: StoredBoardColumn[] = [
  { id: "todo", label: "در انتظار", color: "var(--project-status-blue)", icon: "time-line" },
  { id: "in-progress", label: "در حال انجام", color: "var(--project-status-green)", icon: "figma-progress" },
  { id: "completed", label: "انجام‌شده", color: "var(--project-status-blue)", icon: "checkbox-circle-line" },
  { id: "cancelled", label: "لغو شده", color: "var(--project-status-red)", icon: "pause-circle-line" },
]

export type TaskBoardColumnAssignment = {
  projectId: string
  columnId: string
}

const PROJECT_COLUMNS_KEY = "quire:project-board-columns:v1"
const TASK_COLUMNS_KEY = "quire:task-board-columns:v1"

function readRecord<T>(key: string): Record<string, T> {
  if (typeof window === "undefined") return {}
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? "{}")
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, T> : {}
  } catch {
    return {}
  }
}

export function readProjectBoardColumns(projectId: string): StoredBoardColumn[] {
  const columns = readRecord<StoredBoardColumn[]>(PROJECT_COLUMNS_KEY)[projectId]
  return Array.isArray(columns) ? columns.filter((column) =>
    column && typeof column.id === "string" && typeof column.label === "string" &&
    typeof column.color === "string" && typeof column.icon === "string",
  ) : []
}

export function writeProjectBoardColumns(projectId: string, columns: StoredBoardColumn[]) {
  if (typeof window === "undefined") return
  try {
    const projects = readRecord<StoredBoardColumn[]>(PROJECT_COLUMNS_KEY)
    projects[projectId] = columns
    window.localStorage.setItem(PROJECT_COLUMNS_KEY, JSON.stringify(projects))
    window.dispatchEvent(new Event("quire:project-board-columns-changed"))
  } catch {
    // Keep the in-memory Board usable if browser storage is disabled or full.
  }
}

export function readTaskBoardColumnAssignments(): Record<string, TaskBoardColumnAssignment> {
  return readRecord<TaskBoardColumnAssignment>(TASK_COLUMNS_KEY)
}

export function writeTaskBoardColumnAssignment(taskId: string, assignment?: TaskBoardColumnAssignment) {
  if (typeof window === "undefined") return
  try {
    const assignments = readTaskBoardColumnAssignments()
    if (assignment) assignments[taskId] = assignment
    else delete assignments[taskId]
    window.localStorage.setItem(TASK_COLUMNS_KEY, JSON.stringify(assignments))
    window.dispatchEvent(new Event("quire:task-board-columns-changed"))
  } catch {
    // Keep the in-memory Board usable if browser storage is disabled or full.
  }
}
