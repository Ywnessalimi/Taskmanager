import type { Task } from "@/lib/api/types"

export const STATUS_LABEL: Record<Task["status"], string> = {
  todo: "در انتظار",
  "in-progress": "در حال انجام",
  completed: "انجام‌شده",
}

export const STATUS_COLUMNS: { id: Task["status"]; label: string }[] = [
  { id: "todo", label: "در انتظار" },
  { id: "in-progress", label: "در حال انجام" },
  { id: "completed", label: "انجام‌شده" },
]

export const PRIORITY_LABEL: Record<Task["priority"], string> = {
  none: "بدون اولویت",
  low: "کم",
  medium: "متوسط",
  high: "بالا",
  urgent: "فوری",
}

/** فقط از توکن‌های رنگی موجود در colors.css استفاده می‌کند — هنوز توکن اختصاصی برای «بالا» تعریف نشده. */
export const PRIORITY_COLOR: Record<Task["priority"], string> = {
  none: "var(--text3)",
  low: "var(--link)",
  medium: "var(--warning)",
  high: "var(--error)",
  urgent: "var(--error)",
}

export function PriorityDot({ priority }: { priority: Task["priority"] }) {
  return (
    <span
      className="size-2 shrink-0 rounded-full"
      style={{ backgroundColor: PRIORITY_COLOR[priority] }}
      title={PRIORITY_LABEL[priority]}
    />
  )
}
