"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useTaskPanel } from "@/components/providers/task-panel-provider"
import { PriorityDot } from "@/features/projects/task-display"
import type { Task } from "@/lib/api/types"
import {
  formatDate,
  fromOrdinal,
  MONTH_NAMES,
  parseDate,
  toOrdinal,
  weekdayIndex,
  type JalaliDate,
} from "@/lib/jalali"

type Scale = "day" | "week" | "month"

const SCALES: { id: Scale; label: string }[] = [
  { id: "day", label: "روزانه" },
  { id: "week", label: "هفتگی" },
  { id: "month", label: "ماهانه" },
]

/** حرف اول هر روز هفته، هم‌ترتیب با `WEEKDAY_NAMES` — فقط برای ردیف دوم هدر مقیاس روزانه. */
const WEEKDAY_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"]

/** طبق تقویم ایران، پنج‌شنبه (ایندکس ۵) و جمعه (ایندکس ۶) تعطیل‌اند. */
function isWeekend(index: number): boolean {
  return index === 5 || index === 6
}

/**
 * پس‌زمینه‌ی هاشور‌خورده‌ی روزهای تعطیل — فقط خطوط مورب کم‌رنگ، نه یک رنگ توپر. دوره‌ی تناوب
 * عمداً ۹ پیکسل است (نه هر عددی) چون ارتفاع هر ردیف (هدر روز و ردیف‌های تسک) ۳۶ پیکسل
 * است و ۳۶ دقیقاً مضرب ۹ است — همین باعث می‌شود خطوط مورب دقیقاً در مرز هر سلول ادامه پیدا
 * کنند، نه اینکه هر سلول از صفر شروع کند و در مرزها جابه‌جا/بریده به‌نظر برسد.
 */
const WEEKEND_HATCH_STYLE: React.CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(45deg, var(--border) 0, var(--border) 1px, transparent 1px, transparent 9px)",
}

/**
 * عرض هر ستون روز بر حسب پیکسل، به‌ازای هر مقیاس — مقیاس فقط زوم است (چند روز در یک
 * عرض دیده می‌شود)، نه اندازه‌ی خودِ ستون؛ برخلاف قبل، ستون‌ها همیشه روزانه‌اند
 * (رجوع به یادداشت بالای `buildColumns`).
 */
const COLUMN_WIDTH: Record<Scale, number> = { day: 160, week: 140, month: 120 }

/** حاشیه‌ی قبل/بعد از بازه‌ی تسک‌ها (بر حسب روز) تا تقویم تنگ به‌نظر نرسد. */
const PADDING_DAYS: Record<Scale, number> = { day: 7, week: 21, month: 90 }

const ROW_HEIGHT = "h-9"
const SIDEBAR_WIDTH = "w-44"
/** ارتفاع ردیف دوم هدر (روزها) — کمی بزرگ‌تر از حالت قبل تا عدد روز خواناتر باشد؛ ردیف فاصله‌گذارِ ساید‌بار هم باید همین ارتفاع را داشته باشد. */
const DAY_ROW_HEIGHT = "h-9"

type Column = {
  key: string
  label: string
  /** برچسب گروه بالای ستون — همیشه نام ماه/سال، صرف‌نظر از مقیاس. */
  group: string
  startOrdinal: number
  endOrdinal: number
  weekday: number
}

/**
 * ستون‌های تقویم را بین دو تاریخ می‌سازد — همیشه یک ستون به‌ازای هر روز (برخلاف قبل که در
 * مقیاس هفتگی/ماهانه چند روز را در یک ستون بزرگ‌تر ادغام می‌کرد). با این تغییر خطوط عمودی
 * جداکننده‌ی روزها همیشه تا پایین جدول ادامه دارند و مقیاس فقط عرض هر روز (زوم) را عوض
 * می‌کند؛ ردیف بالایی هدر همیشه فقط بر اساس ماه گروه‌بندی می‌شود (نه هفته) تا خوانا بماند.
 */
function buildColumns(from: JalaliDate, to: JalaliDate): Column[] {
  const columns: Column[] = []
  const lastOrdinal = toOrdinal(to)

  for (let ordinal = toOrdinal(from); ordinal <= lastOrdinal; ordinal++) {
    const date = fromOrdinal(ordinal)
    columns.push({
      key: formatDate(date),
      label: String(date.day),
      group: `${MONTH_NAMES[date.month - 1]} ${date.year}`,
      startOrdinal: ordinal,
      endOrdinal: ordinal,
      weekday: weekdayIndex(date),
    })
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

/** آیا صفحه در عرض دسکتاپ است (همان breakpoint `lg` بقیه‌ی اپ) — فقط آنجا ساخت/تغییرِاندازه‌ی بازه با کلیک/کشیدن فعال است. */
function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches
  )
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)")
    const listener = () => setIsDesktop(query.matches)
    query.addEventListener("change", listener)
    // برخی ابزارهای شبیه‌ساز viewport رویداد `change` را روی MediaQueryList شلیک نمی‌کنند؛
    // `resize` خودِ پنجره یک fallback مطمئن‌تر است.
    window.addEventListener("resize", listener)
    return () => {
      query.removeEventListener("change", listener)
      window.removeEventListener("resize", listener)
    }
  }, [])
  return isDesktop
}

type Range = { startOrdinal: number; endOrdinal: number }

/** بازه‌ی نمایش یک تسک روی گانت — از `startDate`/`dueDate` می‌آید (هرکدام نبود، از آن‌یکی به‌عنوان روز تک‌روزه استفاده می‌شود). */
function taskRange(task: Task): Range | null {
  const start = task.startDate ? parseDate(task.startDate) : null
  const due = task.dueDate ? parseDate(task.dueDate) : null
  if (start && due) {
    const a = toOrdinal(start)
    const b = toOrdinal(due)
    return { startOrdinal: Math.min(a, b), endOrdinal: Math.max(a, b) }
  }
  if (due) return { startOrdinal: toOrdinal(due), endOrdinal: toOrdinal(due) }
  if (start) return { startOrdinal: toOrdinal(start), endOrdinal: toOrdinal(start) }
  return null
}

/**
 * نمای «گانت چارت»: ساید‌بار جمع‌شونده‌ی تسک‌ها در سمت راست + تقویم افقی قابل اسکرول.
 * الهام‌گرفته از طرح Figma «CuGantt» (هدر دوردیفه‌ی مینیمال + ستون‌های تعطیل هاشورخورده)،
 * با تطبیق روی مدل داده و استایل خودمان.
 *
 * ناحیه‌ی تقویم همچنان `dir="ltr"` است تا `scrollLeft` رفتار استاندارد و قابل‌پیش‌بینی داشته
 * باشد، اما خودِ آرایه‌ی `columns` نزولی (از جدید به قدیم) ساخته می‌شود — چون در نسخه‌ی فارسی
 * باید تاریخ قدیم سمت راست و جدید سمت چپ باشد، نه برعکس مثل نمودارهای گانت انگلیسی. با نزولی
 * ساختن خودِ آرایه (نه فقط چرخاندن نمایش)، تمام محاسبات ایندکس/اسکرول/موقعیت باکس بدون نیاز
 * به منطق جداگانه برای دو جهت درست کار می‌کنند. ساید‌بار بیرون از این ناحیه و در سمت راست
 * صفحه (چون کل اپ RTL است) می‌ماند. هدر تاریخ داخل همان کانتینر اسکرول است، پس هم‌زمان با
 * تقویم حرکت می‌کند. ارتفاع کل کامپوننت عمداً محدود نمی‌شود — با رشدِ فهرست تسک‌ها، خودِ صفحه
 * اسکرول می‌شود، نه یک باکس داخلی.
 *
 * **ساخت/تغییرِاندازه‌ی بازه (فقط دسکتاپ، `useIsDesktop`)**: کلیک روی یک سلول خالیِ ردیفِ
 * تسکی که هنوز بازه ندارد، یک تسک تک‌روزه (start=due=همان روز) می‌سازد. بعد از ساخته‌شدن،
 * هاور روی باکس دو دستگیره‌ی نازک در لبه‌ی چپ/راست نشان می‌دهد؛ کشیدن هرکدام با
 * Pointer Events خام (نه dnd-kit، چون این یک تغییرِ اندازه‌ی پیوسته‌ی افقی است، نه
 * جابه‌جایی/ترتیب گسسته) `startDate`/`dueDate` را عوض می‌کند. مثل بقیه‌ی این فاز، فقط در
 * state محلی همین کامپوننت اعمال می‌شود.
 */
export function TimelineView({ tasks: initialTasks, today }: { tasks: Task[]; today: string }) {
  const panel = useTaskPanel()
  const [taskList, setTaskList] = useState(initialTasks)
  const [scale, setScale] = useState<Scale>("week")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [drag, setDrag] = useState<{ taskId: string; side: "start" | "end"; ordinal: number } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const isDesktop = useIsDesktop()

  const todayDate = useMemo(() => parseDate(today), [today])

  function updateTaskDates(taskId: string, patch: Partial<Pick<Task, "startDate" | "dueDate">>) {
    setTaskList((prev) => prev.map((task) => (task.id === taskId ? { ...task, ...patch } : task)))
  }

  const rows = useMemo(
    () => taskList.map((task) => ({ task, range: taskRange(task) })),
    [taskList]
  )

  const columns = useMemo(() => {
    const ordinals = rows.flatMap((row) => (row.range ? [row.range.startOrdinal, row.range.endOrdinal] : []))
    if (todayDate) ordinals.push(toOrdinal(todayDate))
    if (ordinals.length === 0) return []

    const padding = PADDING_DAYS[scale]
    // نزولی: قدیم سمت راست، جدید سمت چپ (رجوع به یادداشت بالای کامپوننت).
    return buildColumns(
      fromOrdinal(Math.min(...ordinals) - padding),
      fromOrdinal(Math.max(...ordinals) + padding)
    ).reverse()
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

  /** آرایه‌ی `columns` نزولی است (جدید در ایندکس ۰)، پس این تابع هنگام کلمپ کردن خارج از بازه، جهت واقعی آرایه را چک می‌کند نه این‌که فرض کند همیشه صعودی است. */
  function ordinalToIndex(ordinal: number): number {
    const index = columns.findIndex((column) => ordinal >= column.startOrdinal && ordinal <= column.endOrdinal)
    if (index !== -1) return index
    if (columns.length === 0) return 0
    const first = columns[0].startOrdinal
    const last = columns[columns.length - 1].startOrdinal
    const ascending = first <= last
    const beforeFirst = ascending ? ordinal < first : ordinal > first
    return beforeFirst ? 0 : columns.length - 1
  }

  function columnAtClientX(taskId: string, clientX: number): Column | null {
    const rowEl = rowRefs.current[taskId]
    if (!rowEl || columns.length === 0) return null
    const rect = rowEl.getBoundingClientRect()
    const index = Math.min(columns.length - 1, Math.max(0, Math.floor((clientX - rect.left) / width)))
    return columns[index] ?? null
  }

  function beginResize(taskId: string, side: "start" | "end") {
    return (event: React.PointerEvent) => {
      event.preventDefault()
      event.stopPropagation()

      function onMove(moveEvent: PointerEvent) {
        const column = columnAtClientX(taskId, moveEvent.clientX)
        if (!column) return
        setDrag({ taskId, side, ordinal: side === "start" ? column.startOrdinal : column.endOrdinal })
      }

      function onUp(upEvent: PointerEvent) {
        window.removeEventListener("pointermove", onMove)
        const column = columnAtClientX(taskId, upEvent.clientX)
        const ordinal = column ? (side === "start" ? column.startOrdinal : column.endOrdinal) : null
        if (ordinal !== null) {
          const range = taskRange(taskList.find((task) => task.id === taskId)!)
          if (range) {
            const startOrdinal = side === "start" ? Math.min(ordinal, range.endOrdinal) : range.startOrdinal
            const endOrdinal = side === "end" ? Math.max(ordinal, range.startOrdinal) : range.endOrdinal
            updateTaskDates(taskId, {
              startDate: formatDate(fromOrdinal(startOrdinal)),
              dueDate: formatDate(fromOrdinal(endOrdinal)),
            })
          }
        }
        setDrag(null)
      }

      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp, { once: true })
    }
  }

  function createRange(taskId: string, column: Column) {
    const date = formatDate(fromOrdinal(column.startOrdinal))
    updateTaskDates(taskId, { startDate: date, dueDate: date })
  }

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

      <div className="flex items-stretch rounded-md bg-background">
        {sidebarOpen && (
          <div className={`${SIDEBAR_WIDTH} shrink-0`}>
            <div className={`flex ${ROW_HEIGHT} items-center px-2.5 text-xs text-text3`}>تسک</div>
            {/* ارتفاع این ردیف باید دقیقاً با ردیف دوم هدر تقویم (DAY_ROW_HEIGHT) یکی بماند */}
            <div className={DAY_ROW_HEIGHT} />
            {rows.map(({ task }) => (
              <div key={task.id} className={`flex ${ROW_HEIGHT} items-center gap-2 px-2.5`}>
                <PriorityDot priority={task.priority} />
                <span className="min-w-0 flex-1 truncate text-xs text-foreground">{task.title}</span>
              </div>
            ))}
          </div>
        )}

        <div ref={scrollRef} dir="ltr" className="min-w-0 flex-1 overflow-x-auto">
          <div style={{ width: columns.length * width }}>
            <div className={`flex ${ROW_HEIGHT} border-b border-border`}>
              {groups.map((group, index) => (
                <div
                  key={`${group.label}-${index}`}
                  style={{ width: group.span * width }}
                  className="flex shrink-0 items-center justify-center border-e border-border/60 text-[11px] font-medium text-text3 last:border-e-0"
                >
                  {group.label}
                </div>
              ))}
            </div>

            <div className={`flex ${DAY_ROW_HEIGHT} border-b border-border`}>
              {columns.map((column, index) => (
                <div
                  key={column.key}
                  style={{ width, ...(isWeekend(column.weekday) ? WEEKEND_HATCH_STYLE : {}) }}
                  className={`flex shrink-0 flex-col items-center justify-center border-e border-border/60 leading-tight last:border-e-0 ${
                    index === todayIndex ? "text-brand" : "text-text3"
                  }`}
                >
                  <span className="text-[10px] opacity-70">{WEEKDAY_SHORT[column.weekday]}</span>
                  <span className={`text-sm ${index === todayIndex ? "font-semibold" : "font-medium"}`}>
                    {column.label}
                  </span>
                </div>
              ))}
            </div>

            {rows.map(({ task, range: committedRange }) => {
              let range = committedRange
              if (drag && drag.taskId === task.id && committedRange) {
                range =
                  drag.side === "start"
                    ? { startOrdinal: Math.min(drag.ordinal, committedRange.endOrdinal), endOrdinal: committedRange.endOrdinal }
                    : { startOrdinal: committedRange.startOrdinal, endOrdinal: Math.max(drag.ordinal, committedRange.startOrdinal) }
              }

              const startIndex = range ? ordinalToIndex(range.startOrdinal) : -1
              const endIndex = range ? ordinalToIndex(range.endOrdinal) : -1
              // چون `columns` نزولی است (جدید=ایندکس کوچک‌تر)، ایندکسِ تاریخ شروع (قدیم‌تر) از تاریخ پایان بزرگ‌تر است؛ برای موقعیت‌دهی باکس باید min/max گرفت، نه فرض ترتیب صعودی.
              const loIndex = Math.min(startIndex, endIndex)
              const hiIndex = Math.max(startIndex, endIndex)

              return (
                <div
                  key={task.id}
                  ref={(el) => {
                    rowRefs.current[task.id] = el
                  }}
                  className={`group/row relative flex ${ROW_HEIGHT}`}
                >
                  {columns.map((column, index) => (
                    <div
                      key={column.key}
                      style={{ width, ...(isWeekend(column.weekday) ? WEEKEND_HATCH_STYLE : {}) }}
                      onClick={
                        isDesktop && !committedRange ? () => createRange(task.id, column) : undefined
                      }
                      className={`h-full shrink-0 border-e border-border/60 transition-colors last:border-e-0 group-hover/row:bg-bg2 ${
                        index === todayIndex ? "bg-bg2" : ""
                      } ${isDesktop && !committedRange ? "cursor-pointer" : ""}`}
                    />
                  ))}

                  {startIndex >= 0 && endIndex >= 0 && (
                    <div
                      style={{ left: loIndex * width + 2, width: (hiIndex - loIndex + 1) * width - 4 }}
                      onClick={() => panel?.openTaskDetail(task)}
                      className="absolute top-1/2 flex h-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-brand px-1.5 ring-brand/40 transition-all group-hover/row:shadow-md group-hover/row:ring-2"
                      title={`${task.title} — ${task.dueDate ?? task.startDate}`}
                    >
                      <span className="truncate text-[10px] text-text-on-brand">{task.title}</span>
                      {isDesktop && (
                        <>
                          {/* در چیدمانِ نزولی، لبه‌ی فیزیکی چپ = تاریخِ جدیدتر (پایان) و لبه‌ی راست = تاریخِ قدیمی‌تر (شروع). */}
                          <span
                            onPointerDown={beginResize(task.id, "end")}
                            onClick={(event) => event.stopPropagation()}
                            className="absolute inset-y-0 left-0 w-2 -translate-x-1/2 cursor-ew-resize rounded-full bg-text-on-brand/0 opacity-0 transition-opacity group-hover/row:bg-text-on-brand/70 group-hover/row:opacity-100"
                          />
                          <span
                            onPointerDown={beginResize(task.id, "start")}
                            onClick={(event) => event.stopPropagation()}
                            className="absolute inset-y-0 right-0 w-2 translate-x-1/2 cursor-ew-resize rounded-full bg-text-on-brand/0 opacity-0 transition-opacity group-hover/row:bg-text-on-brand/70 group-hover/row:opacity-100"
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {rows.some(({ range }) => range === null) && (
        <p className="text-xs text-text3">
          تسک‌های بدون تاریخ سررسید در تقویم نشانه‌ای ندارند و فقط در فهرست کنار آن دیده می‌شوند.
        </p>
      )}
    </div>
  )
}
