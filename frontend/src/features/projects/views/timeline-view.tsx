import type { Task } from "@/lib/api/types"

/**
 * تبدیل ساده‌ی "YYYY/MM/DD" به عدد قابل‌مقایسه — تقویم واقعی (کبیسه و طول ماه‌ها) را در نظر نمی‌گیرد،
 * فقط برای موقعیت نسبی روی محور زمان کافی است.
 */
function toDayIndex(date: string): number | null {
  const parts = date.split("/").map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null
  const [year, month, day] = parts
  return year * 360 + month * 30 + day
}

export function TimelineView({
  tasks,
  startDate,
  endDate,
}: {
  tasks: Task[]
  startDate: string
  endDate: string
}) {
  const start = toDayIndex(startDate)
  const end = toDayIndex(endDate)
  const span = start !== null && end !== null ? end - start : null

  const positioned = tasks
    .map((task) => {
      const dayIndex = task.dueDate ? toDayIndex(task.dueDate) : null
      const position =
        dayIndex !== null && start !== null && span ? ((dayIndex - start) / span) * 100 : null
      return { task, position }
    })
    .filter((item): item is { task: Task; position: number } => item.position !== null)
    .sort((a, b) => a.position - b.position)

  if (positioned.length === 0) {
    return <p className="py-8 text-center text-sm text-text2">تسکی با تاریخ سررسید وجود ندارد.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <div dir="ltr" className="flex justify-between text-xs text-text3">
        <span>{startDate}</span>
        <span>{endDate}</span>
      </div>
      <div className="flex flex-col gap-3">
        {positioned.map(({ task, position }) => (
          <div key={task.id} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-sm text-foreground">{task.title}</span>
            <div dir="ltr" className="relative h-1.5 min-w-0 flex-1 rounded-full bg-bg2">
              <span
                className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand"
                style={{ left: `${Math.min(Math.max(position, 0), 100)}%` }}
                title={task.dueDate}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
