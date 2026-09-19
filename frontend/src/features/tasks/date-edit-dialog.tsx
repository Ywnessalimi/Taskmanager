"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DatePickerDialog } from "@/components/ui/date-picker-dialog"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useT } from "@/components/providers/locale-provider"
import type { RepeatOption } from "@/lib/api/types"
import type { TranslationKey } from "@/lib/i18n/dictionary"

const REPEAT_OPTIONS: RepeatOption[] = ["none", "daily", "weekly", "monthly"]

const REPEAT_KEY: Record<RepeatOption, TranslationKey> = {
  none: "repeat.none",
  daily: "repeat.daily",
  weekly: "repeat.weekly",
  monthly: "repeat.monthly",
}

const FIELD_ROW_CLASS =
  "flex items-center gap-2 border-b border-border py-3 text-sm text-foreground"

const DATE_TRIGGER_CLASS =
  "min-w-0 flex-1 truncate rounded-md p-1.5 text-start text-sm hover:bg-bg2"

/**
 * مودال تمام‌صفحه (موبایل) پیل تاریخ در حالت جزئیات تسک — سه بخش: تاریخ شروع، سررسید و
 * تکرار. برای انتخاب هرکدام از دو تاریخ، همان `DatePickerDialog` موجود به‌صورت تودرتو
 * (nested `Dialog`) باز می‌شود تا منطق گرید تقویم دوباره نوشته نشود.
 */
export function DateEditDialog({
  startDate,
  onStartDateChange,
  dueDate,
  onDueDateChange,
  repeat,
  onRepeatChange,
  trigger,
}: {
  startDate: string
  onStartDateChange: (value: string) => void
  dueDate: string
  onDueDateChange: (value: string) => void
  repeat: RepeatOption
  onRepeatChange: (value: RepeatOption) => void
  trigger: React.ReactNode
}) {
  const t = useT()

  return (
    <Dialog>
      {trigger}
      <DialogContent variant="fullscreen" onClick={(event) => event.stopPropagation()}>
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle>{t("dateEdit.title")}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <div className={FIELD_ROW_CLASS}>
            <RemixIcon name="flag-line" className="shrink-0 text-base text-icon2" />
            <span className="shrink-0 text-text2">{t("dateEdit.startDate")}</span>
            <DatePickerDialog
              value={startDate}
              onChange={onStartDateChange}
              trigger={
                <DialogTrigger className={DATE_TRIGGER_CLASS}>
                  {startDate || t("taskForm.addDate")}
                </DialogTrigger>
              }
            />
          </div>

          <div className={FIELD_ROW_CLASS}>
            <RemixIcon name="calendar-line" className="shrink-0 text-base text-icon2" />
            <span className="shrink-0 text-text2">{t("dateEdit.dueDate")}</span>
            <DatePickerDialog
              value={dueDate}
              onChange={onDueDateChange}
              trigger={
                <DialogTrigger className={DATE_TRIGGER_CLASS}>
                  {dueDate || t("taskForm.addDate")}
                </DialogTrigger>
              }
            />
          </div>

          <div className="flex flex-col gap-2 py-3">
            <span className="flex items-center gap-2 text-sm text-text2">
              <RemixIcon name="repeat-line" className="text-base" />
              {t("dateEdit.repeat")}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {REPEAT_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onRepeatChange(option)}
                  className={`rounded-md px-3 py-1.5 text-sm ${
                    repeat === option
                      ? "bg-brand text-text-on-brand"
                      : "bg-bg2 text-text2 hover:text-foreground"
                  }`}
                >
                  {t(REPEAT_KEY[option])}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
