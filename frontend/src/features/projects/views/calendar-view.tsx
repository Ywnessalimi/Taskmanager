"use client"

import { useEffect, useMemo, useState } from "react"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useTaskPanel } from "@/components/providers/task-panel-provider"
import { PriorityDot } from "@/features/projects/task-display"
import { PROJECT_BOARD_BASE_COLUMNS, readProjectBoardColumns, readTaskBoardColumnAssignments } from "@/features/projects/board-column-storage"
import type { Task } from "@/lib/api/types"
import { currentJalaliDate, formatDate, MONTH_NAMES, parseDate, WEEKDAY_NAMES, type JalaliDate } from "@/lib/jalali"

type CalendarMode = "week" | "month" | "quarter"
type CalendarDay = { date: Date; persian: JalaliDate; key: string; inPeriod: boolean }

const DAY_MS = 86_400_000
const MAX_VISIBLE_PER_DAY = 3
const MODES: { value: CalendarMode; label: string }[] = [
  { value: "week", label: "هفتگی" },
  { value: "month", label: "ماهانه" },
  { value: "quarter", label: "فصلی" },
]
const SEASONS = ["بهار", "تابستان", "پاییز", "زمستان"]
const persianFormatter = new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", {
  timeZone: "UTC", year: "numeric", month: "numeric", day: "numeric",
})

function persianParts(date: Date): JalaliDate {
  const parts = persianFormatter.formatToParts(date)
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  return { year: value("year"), month: value("month"), day: value("day") }
}

function dateNumber({ year, month, day }: JalaliDate): number {
  return year * 10_000 + month * 100 + day
}

/** وارون تبدیل Intl؛ جست‌وجوی دودویی روی روزهای میلادی UTC، با پشتیبانی از اسفند کبیسه. */
function gregorianDate(date: JalaliDate): Date {
  let low = Math.floor(Date.UTC(date.year + 620, 0, 1) / DAY_MS)
  let high = Math.floor(Date.UTC(date.year + 623, 0, 1) / DAY_MS)
  const target = dateNumber(date)
  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if (dateNumber(persianParts(new Date(middle * DAY_MS))) < target) low = middle + 1
    else high = middle
  }
  return new Date(low * DAY_MS)
}

function addDays(date: Date, count: number): Date {
  return new Date(date.getTime() + count * DAY_MS)
}

function saturdayIndex(date: Date): number {
  return (date.getUTCDay() + 1) % 7
}

function monthStart(year: number, month: number): Date {
  const normalizedYear = year + Math.floor((month - 1) / 12)
  const normalizedMonth = ((month - 1) % 12 + 12) % 12 + 1
  return gregorianDate({ year: normalizedYear, month: normalizedMonth, day: 1 })
}

function moveMonth(date: JalaliDate, offset: number): JalaliDate {
  const first = persianParts(monthStart(date.year, date.month + offset))
  const next = monthStart(first.year, first.month + 1)
  const length = Math.round((next.getTime() - monthStart(first.year, first.month).getTime()) / DAY_MS)
  return { ...first, day: Math.min(date.day, length) }
}

function rangeFor(anchor: JalaliDate, mode: CalendarMode) {
  const selected = gregorianDate(anchor)
  if (mode === "week") {
    const start = addDays(selected, -saturdayIndex(selected))
    return { start, end: addDays(start, 6) }
  }
  const firstMonth = mode === "quarter" ? Math.floor((anchor.month - 1) / 3) * 3 + 1 : anchor.month
  return {
    start: monthStart(anchor.year, firstMonth),
    end: addDays(monthStart(anchor.year, firstMonth + (mode === "quarter" ? 3 : 1)), -1),
  }
}

function periodLabel(start: Date, end: Date, mode: CalendarMode): string {
  const first = persianParts(start)
  const last = persianParts(end)
  if (mode === "month") return `${MONTH_NAMES[first.month - 1]} ${first.year}`
  if (mode === "quarter") return `${SEASONS[Math.floor((first.month - 1) / 3)]} ${first.year}`
  if (first.month === last.month) return `${first.day} تا ${last.day} ${MONTH_NAMES[first.month - 1]} ${first.year}`
  return `${first.day} ${MONTH_NAMES[first.month - 1]} تا ${last.day} ${MONTH_NAMES[last.month - 1]} ${last.year}`
}

function todayPersian(): JalaliDate {
  return parseDate(currentJalaliDate())!
}

const FRIDAY_HATCH: React.CSSProperties = {
  backgroundColor: "color-mix(in srgb, var(--project-status-red) 5%, var(--background))",
  backgroundImage: "repeating-linear-gradient(135deg, color-mix(in srgb, var(--project-status-red) 26%, transparent) 0 2px, transparent 2px 12px)",
}

export function CalendarView({ tasks, projectId }: { tasks: Task[]; projectId?: string }) {
  const panel = useTaskPanel()
  const [mode, setMode] = useState<CalendarMode>("month")
  const [anchor, setAnchor] = useState<JalaliDate>(todayPersian)
  const [, setColumnsVersion] = useState(0)

  useEffect(() => {
    const refresh = () => setColumnsVersion((version) => version + 1)
    window.addEventListener("quire:project-board-columns-changed", refresh)
    window.addEventListener("quire:task-board-columns-changed", refresh)
    return () => {
      window.removeEventListener("quire:project-board-columns-changed", refresh)
      window.removeEventListener("quire:task-board-columns-changed", refresh)
    }
  }, [])

  const { start, end } = useMemo(() => rangeFor(anchor, mode), [anchor, mode])
  const days = useMemo(() => {
    const gridStart = addDays(start, -saturdayIndex(start))
    const gridEnd = addDays(end, 6 - saturdayIndex(end))
    const result: CalendarDay[] = []
    for (let time = gridStart.getTime(); time <= gridEnd.getTime(); time += DAY_MS) {
      const date = new Date(time)
      const persian = persianParts(date)
      result.push({ date, persian, key: formatDate(persian), inPeriod: time >= start.getTime() && time <= end.getTime() })
    }
    return result
  }, [start, end])

  const tasksByDay = useMemo(() => {
    const grouped = new Map<string, Task[]>()
    for (const task of tasks) {
      if (!task.dueDate) continue
      const parsed = parseDate(task.dueDate)
      if (!parsed) continue
      const key = formatDate(parsed)
      grouped.set(key, [...(grouped.get(key) ?? []), task])
    }
    return grouped
  }, [tasks])

  const colors = (() => {
    const assignments = readTaskBoardColumnAssignments()
    const cache = new Map<string, ReturnType<typeof readProjectBoardColumns>>()
    const result = new Map<string, string>()
    for (const task of tasks) {
      const taskProjectId = task.projectId ?? projectId
      const assignment = assignments[task.id]
      const assignedProjectId = assignment?.projectId ?? taskProjectId
      if (assignedProjectId && !cache.has(assignedProjectId)) {
        cache.set(assignedProjectId, readProjectBoardColumns(assignedProjectId))
      }
      const columns = assignedProjectId ? cache.get(assignedProjectId) ?? [] : []
      const columnId = assignment?.columnId ?? task.status
      const column = columns.find((item) => item.id === columnId)
        ?? PROJECT_BOARD_BASE_COLUMNS.find((item) => item.id === columnId)
      result.set(task.id, column?.color ?? "var(--text3)")
    }
    return result
  })()

  function navigate(direction: number) {
    setAnchor((current) => {
      if (mode === "week") return persianParts(addDays(gregorianDate(current), direction * 7))
      return moveMonth(current, direction * (mode === "quarter" ? 3 : 1))
    })
  }

  return (
    <section aria-label="تقویم تسک‌ها" className="flex min-h-0 min-w-0 max-h-[calc(100dvh-13rem)] flex-col gap-3 overflow-y-auto overscroll-contain">
      <header className="sticky top-0 z-20 flex shrink-0 flex-wrap items-center justify-between gap-2 bg-background pb-2">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => navigate(-1)} aria-label="بازهٔ قبل" className="flex size-8 items-center justify-center rounded-md text-icon2 hover:bg-bg2">
            <RemixIcon name="arrow-right-s-line" className="text-lg" />
          </button>
          <h2 aria-live="polite" className="min-w-32 text-center text-sm font-medium text-foreground">{periodLabel(start, end, mode)}</h2>
          <button type="button" onClick={() => navigate(1)} aria-label="بازهٔ بعد" className="flex size-8 items-center justify-center rounded-md text-icon2 hover:bg-bg2">
            <RemixIcon name="arrow-left-s-line" className="text-lg" />
          </button>
          <button type="button" onClick={() => setAnchor(todayPersian())} className="ms-1 rounded-md px-2 py-1 text-xs text-text2 hover:bg-bg2">امروز</button>
        </div>
        <div role="group" aria-label="حالت تقویم" className="inline-flex gap-0.5 p-0.5">
          {MODES.map((item) => (
            <button key={item.value} type="button" onClick={() => setMode(item.value)} aria-pressed={mode === item.value} className={`rounded px-3 py-1 text-xs ${mode === item.value ? "bg-bg2 font-medium text-foreground" : "text-text2 hover:text-foreground"}`}>
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <div className="shrink-0 overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-7">
            {WEEKDAY_NAMES.map((name, index) => (
              <div key={name} className={`px-2 py-2 text-center text-xs font-medium ${index === 6 ? "text-[var(--project-status-red)]" : "text-text2"}`}>{name}</div>
            ))}
          </div>
          <div className="relative grid grid-cols-7">
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 end-0" style={{ ...FRIDAY_HATCH, width: "calc(100% / 7)" }} />
            {days.map(({ date, persian, key, inPeriod }, index) => {
              const friday = saturdayIndex(date) === 6
              const dayTasks = tasksByDay.get(key) ?? []
              const visible = dayTasks.slice(0, mode === "week" ? 8 : MAX_VISIBLE_PER_DAY)
              return (
                <div key={key} data-calendar-date={key} className={`relative z-10 flex min-w-0 flex-col gap-1 overflow-hidden border-e border-b border-border p-1.5 ${index < 7 ? "border-t" : ""} ${index % 7 === 0 ? "border-s" : ""} ${mode === "quarter" ? "min-h-20" : "min-h-28 sm:min-h-32"} ${friday ? "" : "bg-background"} ${inPeriod ? "" : "opacity-50"}`}>
                  <span className={`shrink-0 text-xs ${friday ? "font-medium text-[var(--project-status-red)]" : "text-text2"}`}>
                    {persian.day}{persian.day === 1 || mode === "week" ? ` ${MONTH_NAMES[persian.month - 1]}` : ""}
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    {visible.map((task) => {
                      const color = colors.get(task.id) ?? "var(--text3)"
                      return <button key={task.id} type="button" onClick={() => panel?.openTaskDetail(task)} title={task.title} className="flex min-w-0 items-center gap-1 rounded px-1.5 py-1 text-start hover:brightness-95" style={{ backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)` }}>
                        <PriorityDot priority={task.priority} />
                        <span className="min-w-0 flex-1 truncate text-[11px] text-foreground">{task.title}</span>
                      </button>
                    })}
                    {dayTasks.length > visible.length && <span className="px-1 text-[10px] text-text2">+{dayTasks.length - visible.length}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
