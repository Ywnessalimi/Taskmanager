"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useT } from "@/components/providers/locale-provider"
import { RemixIcon } from "@/components/ui/remix-icon"
import type { RepeatOption, TaskRecurrence } from "@/lib/api/types"

type RepeatPickerLayout = "default" | "taskWorkspace"
const OPTIONS: RepeatOption[] = ["none", "daily", "weekly", "monthly"]
const WEEK_DAYS = ["M", "T", "W", "T", "F", "S", "S"]
const EVERY_KEY = { daily: "repeat.everyDaily", weekly: "repeat.everyWeekly", monthly: "repeat.everyMonthly" } as const

export function RepeatPicker({ value, onChange, layout = "default" }: { value: TaskRecurrence; onChange: (value: TaskRecurrence) => void; layout?: RepeatPickerLayout }) {
  const t = useT()
  const frequency = value.frequency ?? "none"
  const interval = Math.max(1, value.interval ?? 1)
  const weekdays = value.weekdays ?? []
  const update = (next: Partial<TaskRecurrence>) => onChange({ ...value, dates: [], ...next })
  const label = frequency === "none" ? t("repeat.none") : t(`repeat.${frequency}` as "repeat.daily")

  return (
    <Dialog>
      <DialogTrigger className={layout === "taskWorkspace" ? "flex w-full min-w-0 items-center gap-3 rounded-md py-1 text-start hover:bg-bg2" : "flex min-h-8 w-full items-center gap-3 rounded-md text-start text-[13px] hover:bg-bg2"}>
        <span className={layout === "taskWorkspace" ? "flex w-30 shrink-0 items-center gap-1.5 text-[13px] text-[var(--task-workspace-muted)]" : "flex w-30 shrink-0 items-center gap-1.5 text-text2"}>
          <RemixIcon name="repeat-line" className="text-base" />{t("dateEdit.repeat")}
        </span>
        <span className={layout === "taskWorkspace" ? "min-w-0 truncate text-[13px] text-foreground" : "text-text2"}>
          {frequency === "none" ? label : t(EVERY_KEY[frequency]).replace("{count}", String(interval))}
        </span>
      </DialogTrigger>
      <DialogContent overlayClassName="bg-black/15" className="max-w-md p-0">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle>{t("dateEdit.repeat")}</DialogTitle>
        </DialogHeader>
        <div className="border-b border-border px-5 pb-5 pt-3">
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>{t("repeat.count")}</span>
            <div className="flex items-center gap-2" dir="ltr">
              <button type="button" aria-label={t("repeat.decreaseCount")} onClick={() => update({ count: Math.max(1, value.count - 1) })} className="flex size-9 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-bg2"><RemixIcon name="subtract-line" className="text-base" /></button>
              <output aria-label={t("repeat.count")} className="flex size-9 items-center justify-center rounded-md border border-border bg-background text-sm">{value.count}</output>
              <button type="button" aria-label={t("repeat.increaseCount")} onClick={() => update({ count: value.count + 1 })} className="flex size-9 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-bg2"><RemixIcon name="add-line" className="text-base" /></button>
            </div>
          </label>
        </div>
        <div role="radiogroup" aria-label={t("dateEdit.repeat")} className="flex flex-col gap-1 p-4">
          {OPTIONS.map((option) => (
            <label key={option} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 text-sm ${frequency === option ? "bg-bg2" : "hover:bg-bg2"}`}>
              <input type="radio" name="task-repeat-frequency" value={option} checked={frequency === option} onChange={() => update({ frequency: option, interval: option === "none" ? 1 : interval, weekdays: option === "weekly" ? weekdays : [] })} className="size-4 accent-brand" />
              {option === "none" ? t("repeat.none") : <>
                <span>{t(EVERY_KEY[option]).split("{count}")[0]}</span>
                <input aria-label={t(EVERY_KEY[option]).replace("{count}", "")} type="number" min={1} step={1} value={interval} onFocus={() => update({ frequency: option })} onChange={(event) => update({ frequency: option, interval: Math.max(1, Math.floor(Number(event.target.value) || 1)) })} className="h-8 w-14 rounded-none border-0 border-b border-border bg-transparent px-1 text-center outline-none focus:border-brand" />
                <span>{t(EVERY_KEY[option]).split("{count}")[1]}</span>
              </>}
            </label>
          ))}
          {frequency === "weekly" && <div className="flex justify-between gap-2 px-2 pb-2 pt-1" dir="ltr">
            {WEEK_DAYS.map((day, index) => {
              const selected = weekdays.includes(index)
              return <button key={index} type="button" aria-label={t(`repeat.weekday${index}` as "repeat.weekday0")} aria-pressed={selected} onClick={() => {
                const next = selected ? weekdays.filter((item) => item !== index) : [...weekdays, index].sort()
                update(next.length === 7 ? { frequency: "daily", interval: 1, weekdays: [] } : { weekdays: next })
              }} className={`size-9 rounded-full border text-xs font-medium ${selected ? "border-brand text-brand" : "border-border text-text2"}`}>{day}</button>
            })}
          </div>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
