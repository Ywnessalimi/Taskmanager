"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { RemixIcon } from "@/components/ui/remix-icon"
import { PriorityDot } from "@/features/projects/task-display"
import type { Task } from "@/lib/api/types"
import {
  addDays,
  daysInMonth,
  formatDate,
  fromOrdinal,
  MONTH_NAMES,
  parseDate,
  startOfWeek,
  toOrdinal,
  type JalaliDate,
} from "@/lib/jalali"

type Scale = "day" | "week" | "month"

const SCALES: { id: Scale; label: string }[] = [
  { id: "day", label: "روزانه" },
  { id: "week", label: "هفتگی" },
  { id: "month", label: "ماهانه" },
]

/** عرض هر ستون تقویم بر حسب پیکسل، به‌ازای هر مقیاس. */
const COLUMN_WIDTH: Record<Scale, number> = { day: 44, week: 72, month: 104 }

/** حاشیه‌ی قبل/بعد از بازه‌ی تسک‌ها (بر حسب روز) تا تقویم تنگ به‌نظر نرسد. */
const PADDING_DAYS: Record<Scale, number> = { day: 7, week: 21, month: 90 }

const ROW_HEIGHT = "h-9"
const SIDEBAR_WIDTH = "w-44"

type Column = {
  key: string
  label: string
  /** برچسب گروه بالای ستون (ماه برای روز/هفته، سال برای ماه) */
  group: string
  startOrdinal: number
  endOrdinal: number
}

/** ستون‌های تقویم را بین دو تاریخ می‌سازد؛ هر ستون یک روز، یک هفته یا یک ماه است. */
function buildColumns(from: JalaliDate, to: JalaliDate, scale: Scale): Column[] {
  const columns: Column[] = []
  const lastOrdinal = toOrdinal(to)

  if (scale === "day") {
    for (let ordinal = toOrdinal(from); ordinal <= lastOrdinal; ordinal++) {
      const date = fromOrdinal(ordinal)
      columns.push({
        key: formatDate(date),
        label: String(date.day),
        group: `${MONTH_NAMES[date.month - 1]} ${date.year}`,
        startOrdinal: ordinal,
        endOrdinal: ordinal,
      })
    }
    return columns
  }

  if (scale === "week") {
    let cursor = startOfWeek(from)
    while (toOrdinal(cursor) <= lastOrdinal) {
      const start = toOrdinal(cursor)
      columns.push({
        key: formatDate(cursor),
        label: `${cursor.day} ${MONTH_NAMES[cursor.month - 1].slice(0, 3)}`,
        group: `${MONTH_NAMES[cursor.month - 1]} ${cursor.year}`,
        startOrdinal: start,
        endOrdinal: start + 6,
      })
      cursor = addDays(cursor, 7)
    }
    return columns
  }

  let cursor: JalaliDate = { year: from.year, month: from.month, day: 1 }
  while (toOrdinal(cursor) <= lastOrdinal) {
    const start = toOrdinal(cursor)
    columns.push({
      key: `${cursor.year}-${cursor.month}`,
      label: MONTH_NAMES[cursor.month - 1],
      group: String(cursor.year),
      startOrdinal: start,
      endOrdinal: start + daysInMonth(cursor.month) - 1,
    })
    cursor =
      cursor.month === 12
        ? { year: cursor.year + 1, month: 1, day: 1 }
        : { year: cursor.year, month: cursor.month + 1, day: 1 }
  }
  return columns
}

/** ستون‌های هم‌گروه را برای ردیف بالایی هدر (نام ماه/سال) کنار هم جمع می‌کند. */
function groupColumns(columns: Column[]): { label: string; span: number }[] {
  const groups: { label: string; span: number }[] = []
  for (const column of columns) {
    const last = groups[groups.length - 1]
    if (last && last.label === column.group) last.span++
    else groups.push({ label: column.group, span: 1 })
  }
  return groups
}

/**
 * نمای «خط زمانی»: ساید‌بار جمع‌شونده‌ی تسک‌ها در سمت راست + تقویم افقی قابل اسکرول.
 *
 * ناحیه‌ی تقویم عمداً `dir="ltr"` است (تاریخ از چپ به راست جلو می‌رود، مثل هر نمودار گانتی)
 * و همین باعث می‌شود `scrollLeft` رفتار استاندارد و قابل‌پیش‌بینی داشته باشد؛ ساید‌بار بیرون
 * از این ناحیه و در سمت راست صفحه (چون کل اپ RTL است) می‌ماند. هدر تاریخ داخل همان کانتینر
 * اسکرول است، پس هم‌زمان با تقویم حرکت می‌کند.
 */
export function TimelineView({ tasks, today }: { tasks: Task[]; today: string }) {
  const [scale, setScale] = useState<Scale>("week")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const todayDate = useMemo(() => parseDate(today), [today])

  const rows = useMemo(
    () => tasks.map((task) => ({ task, date: task.dueDate ? parseDate(task.dueDate) : null })),
    [tasks]
  )

  const columns = useMemo(() => {
    const ordinals = rows
      .map((row) => row.date)
      .filter((date): date is JalaliDate => date !== null)
      .map(toOrdinal)
    if (todayDate) ordinals.push(toOrdinal(todayDate))
    if (ordinals.length === 0) return []

    const padding = PADDING_DAYS[scale]
    return buildColumns(
      fromOrdinal(Math.min(...ordinals) - padding),
      fromOrdinal(Math.max(...ordinals) + padding),
      scale
    )
  }, [rows, todayDate, scale])

  const groups = useMemo(() => groupColumns(columns), [columns])
  const width = COLUMN_WIDTH[scale]

  const todayIndex = useMemo(() => {
    if (!todayDate) return -1
    const ordinal = toOrdinal(todayDate)
    return columns.findIndex(
      (column) => ordinal >= column.startOrdinal && ordinal <= column.endOrdinal
    )
  }, [columns, todayDate])

  function todayOffset(container: HTMLDivElement) {
    return Math.max(0, todayIndex * width - container.clientWidth / 2 + width / 2)
  }

  function scrollToToday() {
    const container = scrollRef.current
    if (!container || todayIndex < 0) return
    container.scrollTo({ left: todayOffset(container), behavior: "smooth" })
  }

  /** با هر بار عوض‌شدن مقیاس، تقویم دوباره روی «امروز» تنظیم می‌شود تا کاربر گم نشود. */
  useEffect(() => {
    const container = scrollRef.current
    if (!container || todayIndex < 0) return
    container.scrollLeft = Math.max(0, todayIndex * width - container.clientWidth / 2 + width / 2)
  }, [todayIndex, width])

  if (columns.length === 0) {
    return <p className="py-8 text-center text-sm text-text2">تسکی با تاریخ سررسید وجود ندارد.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setSidebarOpen((open) => !open)}
          aria-label={sidebarOpen ? "بستن فهرست تسک‌ها" : "باز کردن فهرست تسک‌ها"}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-icon2 hover:bg-bg2 hover:text-icon"
        >
          <RemixIcon
            name={sidebarOpen ? "menu-fold-line" : "menu-unfold-line"}
            className="text-base"
          />
        </button>

        <div className="flex gap-1">
          {SCALES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setScale(item.id)}
              className={`rounded-md px-2.5 py-1 text-xs ${
                scale === item.id
                  ? "bg-background text-foreground"
                  : "text-text2 hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={scrollToToday}
          disabled={todayIndex < 0}
          className="ms-auto flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-text2 hover:text-foreground disabled:opacity-40"
        >
          <RemixIcon name="focus-3-line" className="text-sm" />
          امروز
        </button>
      </div>

      <div className="flex items-stretch rounded-md border border-border bg-background">
        {sidebarOpen && (
          <div className={`${SIDEBAR_WIDTH} shrink-0 border-e border-border`}>
            <div
              className={`flex ${ROW_HEIGHT} items-center border-b border-border bg-bg2 px-2.5 text-xs text-text2`}
            >
              تسک
            </div>
            {/* ارتفاع این ردیف باید دقیقاً با ردیف دوم هدر تقویم (h-7) یکی بماند */}
            <div className="h-7 border-b border-border bg-bg2" />
            {rows.map(({ task }) => (
              <div
                key={task.id}
                className={`flex ${ROW_HEIGHT} items-center gap-2 border-b border-border px-2.5 last:border-b-0`}
              >
                <PriorityDot priority={task.priority} />
                <span className="min-w-0 flex-1 truncate text-xs text-foreground">{task.title}</span>
              </div>
            ))}
          </div>
        )}

        <div ref={scrollRef} dir="ltr" className="min-w-0 flex-1 overflow-x-auto">
          <div style={{ width: columns.length * width }}>
            <div className={`flex ${ROW_HEIGHT} border-b border-border bg-bg2`}>
              {groups.map((group, index) => (
                <div
                  key={`${group.label}-${index}`}
                  style={{ width: group.span * width }}
                  className="flex items-center justify-center border-r border-border text-xs text-text2 last:border-r-0"
                >
                  {group.label}
                </div>
              ))}
            </div>

            <div className="flex h-7 border-b border-border bg-bg2">
              {columns.map((column, index) => (
                <div
                  key={column.key}
                  style={{ width }}
                  className={`flex items-center justify-center border-r border-border text-[11px] last:border-r-0 ${
                    index === todayIndex ? "text-brand" : "text-text3"
                  }`}
                >
                  {column.label}
                </div>
              ))}
            </div>

            {rows.map(({ task, date }) => {
              const ordinal = date ? toOrdinal(date) : null
              const columnIndex =
                ordinal === null
                  ? -1
                  : columns.findIndex(
                      (column) => ordinal >= column.startOrdinal && ordinal <= column.endOrdinal
                    )

              return (
                <div
                  key={task.id}
                  className={`relative flex ${ROW_HEIGHT} border-b border-border last:border-b-0`}
                >
                  {columns.map((column, index) => (
                    <div
                      key={column.key}
                      style={{ width }}
                      className={`h-full border-r border-border last:border-r-0 ${
                        index === todayIndex ? "bg-bg2" : ""
                      }`}
                    />
                  ))}

                  {columnIndex >= 0 && (
                    <div
                      style={{ left: columnIndex * width + 2, width: width - 4 }}
                      className="absolute top-1/2 flex h-5 -translate-y-1/2 items-center justify-center rounded-full bg-brand px-1.5"
                      title={`${task.title} — ${task.dueDate}`}
                    >
                      <span className="truncate text-[10px] text-text-on-brand">{task.title}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {rows.some(({ date }) => date === null) && (
        <p className="text-xs text-text3">
          تسک‌های بدون تاریخ سررسید در تقویم نشانه‌ای ندارند و فقط در فهرست کنار آن دیده می‌شوند.
        </p>
      )}
    </div>
  )
}
