"use client"

import { useState } from "react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useLocale } from "@/components/providers/locale-provider"
import * as jalali from "@/lib/jalali"
import { MOCK_TODAY } from "@/lib/api/mock-data"

const GREGORIAN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]
const GREGORIAN_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

type Cursor = { year: number; month: number }
type Cell = { day: number; value: string }

function gregorianToday(): string {
  const d = new Date()
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`
}

/**
 * پیکر تاریخ مودال — تقویم بسته به زبان جاری فرق می‌کند: جلالی/شمسی در فارسی (با
 * `src/lib/jalali.ts` تا با بقیه‌ی اپ یکدست بماند)، میلادی واقعی (`Date` بومی) در انگلیسی.
 * چون این دو سیستم شمارش روز کاملاً مستقلند و هیچ تبدیل واقعی جلالی↔میلادی در پروژه پیاده
 * نشده (رجوع به `jalali.ts`: «تقویم واقعی نیست»)، مقدار ذخیره‌شده صرفاً همان رشته‌ای است که
 * همان تقویم تولید کرده — تبدیل بین‌زبانی لازم نیست چون این فرم هنوز داده را واقعاً ذخیره
 * نمی‌کند (رجوع به `src/features/tasks/README.md`).
 */
export function DatePickerDialog({
  value,
  onChange,
  trigger,
}: {
  value: string
  onChange: (value: string) => void
  trigger: React.ReactNode
}) {
  const { locale, t } = useLocale()
  const isFa = locale === "fa"
  const today = isFa ? MOCK_TODAY : gregorianToday()

  const [cursor, setCursor] = useState<Cursor>(() => {
    if (isFa) {
      const parsed = (value && jalali.parseDate(value)) || jalali.parseDate(MOCK_TODAY)!
      return { year: parsed.year, month: parsed.month }
    }
    const now = new Date()
    const parts = value ? value.split("/").map(Number) : null
    return {
      year: parts && !Number.isNaN(parts[0]) ? parts[0] : now.getFullYear(),
      month: parts && !Number.isNaN(parts[1]) ? parts[1] - 1 : now.getMonth(),
    }
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

  const monthLabel = isFa ? jalali.MONTH_NAMES[cursor.month - 1] : GREGORIAN_MONTHS[cursor.month]
  const weekdayLabels = isFa ? jalali.WEEKDAY_NAMES.map((name) => name.slice(0, 1)) : GREGORIAN_WEEKDAYS

  const leading = isFa
    ? jalali.weekdayIndex({ year: cursor.year, month: cursor.month, day: 1 })
    : new Date(cursor.year, cursor.month, 1).getDay()
  const total = isFa ? jalali.daysInMonth(cursor.month) : new Date(cursor.year, cursor.month + 1, 0).getDate()

  const cells: (Cell | null)[] = Array.from({ length: leading }, () => null)
  for (let day = 1; day <= total; day++) {
    const dayValue = isFa
      ? jalali.formatDate({ year: cursor.year, month: cursor.month, day })
      : `${cursor.year}/${String(cursor.month + 1).padStart(2, "0")}/${String(day).padStart(2, "0")}`
    cells.push({ day, value: dayValue })
  }

  // در RTL «قبل» سمت راست و «بعد» سمت چپ است (مطابق CalendarView موجود)؛ در LTR برعکس.
  const prevIcon = isFa ? "arrow-right-s-line" : "arrow-left-s-line"
  const nextIcon = isFa ? "arrow-left-s-line" : "arrow-right-s-line"

  return (
    <Dialog>
      {trigger}
      <DialogContent className="sm:max-w-[280px]">
        <DialogHeader>
          <DialogTitle>{t("taskForm.addDate")}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label={t("datePicker.prevMonth")}
            className="flex size-7 items-center justify-center rounded-md text-icon2 hover:bg-bg2 hover:text-icon"
          >
            <RemixIcon name={prevIcon} className="text-lg" />
          </button>
          <span className="text-sm font-medium text-foreground">
            {monthLabel} {cursor.year}
          </span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label={t("datePicker.nextMonth")}
            className="flex size-7 items-center justify-center rounded-md text-icon2 hover:bg-bg2 hover:text-icon"
          >
            <RemixIcon name={nextIcon} className="text-lg" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-text2">
          {weekdayLabels.map((label, index) => (
            <span key={index}>{label}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, index) =>
            cell === null ? (
              <span key={`empty-${index}`} />
            ) : (
              <DialogClose
                key={cell.value}
                render={
                  <button
                    type="button"
                    onClick={() => onChange(cell.value)}
                    className={`flex size-8 items-center justify-center rounded-md text-sm ${
                      cell.value === value
                        ? "bg-brand text-text-on-brand"
                        : cell.value === today
                          ? "font-medium text-brand hover:bg-bg2"
                          : "text-foreground hover:bg-bg2"
                    }`}
                  />
                }
              >
                {cell.day}
              </DialogClose>
            )
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <DialogClose
            render={<button type="button" onClick={() => onChange(today)} className="text-sm text-brand hover:opacity-80" />}
          >
            {t("datePicker.today")}
          </DialogClose>
          {value && (
            <DialogClose
              render={<button type="button" onClick={() => onChange("")} className="text-sm text-text2 hover:text-foreground" />}
            >
              {t("datePicker.clear")}
            </DialogClose>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
