"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useT } from "@/components/providers/locale-provider"

const PILL_CLASS =
  "flex items-center gap-1.5 rounded-md p-2 text-sm text-text2 hover:bg-bg2 hover:text-foreground"

/**
 * تایمر تسک به‌صورت یک هوک کنترل‌شده (Controlled): مقدار «مجموع دقیقه‌ها» و تابع تغییرش از
 * بیرون (state پدر، یعنی `TaskForm`) می‌آید تا هم `StartTimerPill` (ردیف پیل‌ها) و هم
 * `TimeSpentBox`/`TimerDialog` روی یک تایمر مشترک کار کنند. خودِ هوک فقط وضعیت «در حال
 * اجراست یا نه» و ثانیه‌های سپری‌شده‌ی دورِ جاری را نگه می‌دارد؛ با توقف، دقیقه‌های آن دور
 * (حداقل ۱ دقیقه، گرد به بالا) به مجموع اضافه می‌شود.
 */
export function useTaskTimer(minutes: number, onMinutesChange: (minutes: number) => void) {
  const [running, setRunning] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000)
    return () => clearInterval(interval)
  }, [running])

  function toggle() {
    if (running) {
      setRunning(false)
      if (elapsedSeconds > 0) {
        onMinutesChange(minutes + Math.max(1, Math.ceil(elapsedSeconds / 60)))
      }
      setElapsedSeconds(0)
    } else {
      setRunning(true)
    }
  }

  return { running, elapsedSeconds, toggle }
}

export type TaskTimerState = ReturnType<typeof useTaskTimer>

function formatClock(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":")
}

/** پیل «شروع زمان‌شمار» کنار پیل‌های تاریخ/برچسب/مسئول — مستقیماً تایمر مشترک را روشن/خاموش می‌کند. */
export function StartTimerPill({ timer }: { timer: TaskTimerState }) {
  const t = useT()
  return (
    <button type="button" onClick={timer.toggle} className={PILL_CLASS}>
      <RemixIcon name={timer.running ? "pause-line" : "play-line"} className="text-base" />
      {timer.running ? t("taskDetail.stopTimer") : t("taskDetail.startTimer")}
    </button>
  )
}

/** باکس «زمان صرف‌شده» زیر توضیحات — کلیک روی آن `TimerDialog` را باز می‌کند. */
export function TimeSpentBox({ minutes, timer }: { minutes: number; timer: TaskTimerState }) {
  const t = useT()
  const liveMinutes = minutes + (timer.running ? Math.floor(timer.elapsedSeconds / 60) : 0)

  return (
    <Dialog>
      <DialogTrigger className="flex w-full items-center gap-2 border-b border-border py-3 text-sm text-foreground hover:bg-bg2">
        <RemixIcon name="timer-line" className="text-base text-icon2" />
        <span>
          {liveMinutes} {t("taskDetail.minutesSuffix")}
        </span>
        {timer.running && <span className="ms-auto text-xs text-brand">{formatClock(timer.elapsedSeconds)}</span>}
      </DialogTrigger>
      <DialogContent variant="fullscreen" onClick={(event) => event.stopPropagation()}>
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle>{t("taskDetail.timerTitle")}</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 p-4">
          <span className="font-mono text-4xl font-medium text-foreground">
            {formatClock(minutes * 60 + timer.elapsedSeconds)}
          </span>
          <Button type="button" onClick={timer.toggle}>
            <RemixIcon name={timer.running ? "pause-line" : "play-line"} className="text-base" />
            {timer.running ? t("taskDetail.stopTimer") : t("taskDetail.startTimer")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
