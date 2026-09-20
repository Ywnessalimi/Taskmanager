"use client"

import { useMemo, useState } from "react"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useTaskPanel } from "@/components/providers/task-panel-provider"
import { PriorityDot } from "@/features/projects/task-display"
import type { Task } from "@/lib/api/types"
import { daysInMonth, MONTH_NAMES, parseDate, type JalaliDate } from "@/lib/jalali"

/** حداکثر تعداد تسکِ نمایش‌داده‌شده داخل هر خانه‌ی روز، قبل از تبدیل بقیه به «+N». */
const MAX_VISIBLE_PER_DAY = 3

/** بدون تراز واقعی روز هفته (نیازمند محاسبه‌ی تقویم جلالی واقعی) — فقط شبکه‌ی روزهای ماه. */
export function CalendarView({ tasks }: { tasks: Task[] }) {
  const panel = useTaskPanel()
  const datedTasks = useMemo(
    () =>
      tasks
        .map((task) => ({ task, date: task.dueDate ? parseDate(task.dueDate) : null }))
        .filter((item): item is { task: Task; date: JalaliDate } => item.date !== null),
    [tasks]
  )

  const months = useMemo(() => {
    const seen = new Map<string, { year: number; month: number }>()
    for (const { date } of datedTasks) {
      const key = `${date.year}-${date.month}`
      if (!seen.has(key)) seen.set(key, { year: date.year, month: date.month })
    }
    return [...seen.values()].sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month))
  }, [datedTasks])

  const [monthIndex, setMonthIndex] = useState(0)

  if (months.length === 0) {
    return <p className="py-8 text-center text-sm text-text2">تسکی با تاریخ سررسید وجود ندارد.</p>
  }

  const current = months[monthIndex]
  const tasksInMonth = datedTasks
    .filter(({ date }) => date.year === current.year && date.month === current.month)
    .sort((a, b) => a.date.day - b.date.day)
  const days = Array.from({ length: daysInMonth(current.month) }, (_, i) => i + 1)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={monthIndex === 0}
          onClick={() => setMonthIndex((i) => Math.max(0, i - 1))}
          aria-label="ماه قبل"
          className="flex size-7 items-center justify-center rounded-md text-icon2 hover:bg-bg2 disabled:opacity-30"
        >
          <RemixIcon name="arrow-right-s-line" className="text-lg" />
        </button>
        <span className="text-sm font-medium text-foreground">
          {MONTH_NAMES[current.month - 1]} {current.year}
        </span>
        <button
          type="button"
          disabled={monthIndex === months.length - 1}
          onClick={() => setMonthIndex((i) => Math.min(months.length - 1, i + 1))}
          aria-label="ماه بعد"
          className="flex size-7 items-center justify-center rounded-md text-icon2 hover:bg-bg2 disabled:opacity-30"
        >
          <RemixIcon name="arrow-left-s-line" className="text-lg" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-border bg-border">
        {days.map((day) => {
          const dayTasks = tasksInMonth.filter(({ date }) => date.day === day)
          const visible = dayTasks.slice(0, MAX_VISIBLE_PER_DAY)
          const hiddenCount = dayTasks.length - visible.length

          return (
            <div key={day} className="flex aspect-square flex-col gap-0.5 overflow-hidden bg-background p-1">
              <span className="shrink-0 text-[11px] text-text2">{day}</span>
              <div className="flex min-h-0 flex-1 flex-col gap-0.5">
                {visible.map(({ task }) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => panel?.openTaskDetail(task)}
                    title={task.title}
                    className="flex min-w-0 items-center gap-1 rounded-sm bg-bg2 px-1 py-px text-start hover:bg-bg3"
                  >
                    <PriorityDot priority={task.priority} />
                    <span className="min-w-0 flex-1 truncate text-[9px] leading-tight text-foreground">
                      {task.title}
                    </span>
                  </button>
                ))}
                {hiddenCount > 0 && (
                  <span className="px-1 text-[9px] leading-tight text-text3">+{hiddenCount}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {tasksInMonth.length > 0 && (
        <div className="flex flex-col">
          {tasksInMonth.map(({ task, date }) => (
            <div key={task.id} className="flex items-center gap-3 border-t border-border py-2 first:border-t-0">
              <span className="w-6 shrink-0 text-xs text-text3">{date.day}</span>
              <PriorityDot priority={task.priority} />
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">{task.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
