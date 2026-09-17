"use client"

import { useState } from "react"
import { LEVEL_CLASSES } from "@/components/charts/activity-heatmap"
import { OverviewCard } from "@/components/layout/section"
import { GREGORIAN_MONTHS, GREGORIAN_WEEKDAYS } from "@/components/ui/date-picker-dialog"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useLocale } from "@/components/providers/locale-provider"
import { MOCK_TODAY } from "@/lib/api/mock-data"
import type { Task } from "@/lib/api/types"
import * as jalali from "@/lib/jalali"

/** `month` مثل `DatePickerDialog`: در فارسی ۱ تا ۱۲ (جلالی)، در انگلیسی ۰ تا ۱۱ (میلادی واقعی). */
type Cursor = { year: number; month: number }

function dayOfMonth(date: string): number | null {
  const day = Number(date.split("/").pop())
  return Number.isNaN(day) ? null : day
}

/**
 * تقویم سررسیدها — طبق طرح Figma «Deadline Calendar»: شبکه‌ی ماهانه‌ی واقعی (با تراز روز
 * هفته) که تراکم رنگ هر روز از تعداد تسک‌های سررسیددارِ همان *روزِ ماه* می‌آید (نه سال/ماه
 * دقیق — چون تاریخ‌های Mock فقط روز-از-ماه معنادار دارند، همان‌طور که پیاده‌سازی قبلی این
 * بخش هم فرض می‌کرد). تقویم مثل `DatePickerDialog` زبان‌محور است: جلالی در فارسی، میلادی
 * واقعی در انگلیسی؛ چون تطبیق فقط روی روزِ ماه است، جابه‌جایی زبان الگوی تراکم را حفظ می‌کند.
 */
export function DeadlineCalendar({ tasks }: { tasks: Task[] }) {
  const { locale, t } = useLocale()
  const isFa = locale === "fa"

  const dueCounts = new Map<number, number>()
  for (const task of tasks) {
    if (!task.dueDate) continue
    const day = dayOfMonth(task.dueDate)
    if (day !== null) dueCounts.set(day, (dueCounts.get(day) ?? 0) + 1)
  }

  const [cursor, setCursor] = useState<Cursor>(() => {
    if (isFa) {
      const today = jalali.parseDate(MOCK_TODAY)!
      return { year: today.year, month: today.month }
    }
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  function shiftMonth(delta: number) {
    setCursor((prev) => {
      const min = isFa ? 1 : 0
      const max = isFa ? 12 : 11
      const next = prev.month + delta
      if (next < min) return { year: prev.year - 1, month: max }
      if (next > max) return { year: prev.year + 1, month: min }
      return { year: prev.year, month: next }
    })
  }

  function goToday() {
    if (isFa) {
      const today = jalali.parseDate(MOCK_TODAY)!
      setCursor({ year: today.year, month: today.month })
    } else {
      const now = new Date()
      setCursor({ year: now.getFullYear(), month: now.getMonth() })
    }
  }

  const monthLabel = isFa ? jalali.MONTH_NAMES[cursor.month - 1] : GREGORIAN_MONTHS[cursor.month]
  const weekdayLabels = isFa ? jalali.WEEKDAY_NAMES.map((name) => name.slice(0, 1)) : GREGORIAN_WEEKDAYS

  const leading = isFa
    ? jalali.weekdayIndex({ year: cursor.year, month: cursor.month, day: 1 })
    : new Date(cursor.year, cursor.month, 1).getDay()
  const totalDays = isFa ? jalali.daysInMonth(cursor.month) : new Date(cursor.year, cursor.month + 1, 0).getDate()

  const todayDay = (() => {
    if (isFa) {
      const today = jalali.parseDate(MOCK_TODAY)!
      return today.year === cursor.year && today.month === cursor.month ? today.day : null
    }
    const now = new Date()
    return now.getFullYear() === cursor.year && now.getMonth() === cursor.month ? now.getDate() : null
  })()

  const days = Array.from({ length: totalDays }, (_, i) => i + 1)
  const visibleDueCount = days.reduce((sum, day) => sum + (dueCounts.get(day) ?? 0), 0)

  const prevIcon = isFa ? "arrow-right-s-line" : "arrow-left-s-line"
  const nextIcon = isFa ? "arrow-left-s-line" : "arrow-right-s-line"

  return (
    <OverviewCard
      title={t("project.deadlineCalendar")}
      subtitle={`${visibleDueCount} ${t("project.tasksDueSuffix")}`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground">
            {monthLabel} <span className="text-text2">{cursor.year}</span>
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center overflow-hidden rounded-md border border-border">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label={t("datePicker.prevMonth")}
                className="flex size-7 items-center justify-center border-e border-border text-icon2 hover:bg-bg2 hover:text-icon"
              >
                <RemixIcon name={prevIcon} className="text-base" />
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label={t("datePicker.nextMonth")}
                className="flex size-7 items-center justify-center text-icon2 hover:bg-bg2 hover:text-icon"
              >
                <RemixIcon name={nextIcon} className="text-base" />
              </button>
            </div>
            <button
              type="button"
              onClick={goToday}
              className="rounded-md border border-border px-3 py-1 text-sm text-text2 hover:bg-bg2 hover:text-foreground"
            >
              {t("datePicker.today")}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-text2">
            {weekdayLabels.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leading }, (_, i) => (
              <span key={`empty-${i}`} />
            ))}
            {days.map((day) => {
              const count = dueCounts.get(day) ?? 0
              const level = Math.min(count, 4)
              const isToday = day === todayDay
              return (
                <span
                  key={day}
                  title={`${day} ${monthLabel} — ${count}`}
                  className={`h-6 rounded-sm ${LEVEL_CLASSES[level]} ${isToday ? "ring-2 ring-inset ring-warning" : ""}`}
                />
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 text-xs text-text2">
          <span>{t("activity.less")}</span>
          <div className="flex items-center gap-1">
            {LEVEL_CLASSES.map((cls, i) => (
              <span key={i} className={`size-3 rounded-sm ${cls}`} />
            ))}
          </div>
          <span>{t("activity.more")}</span>
        </div>
      </div>
    </OverviewCard>
  )
}
