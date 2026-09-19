"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useT } from "@/components/providers/locale-provider"
import type { TaskActivityEntry } from "@/lib/api/types"

/**
 * باکس «لاگ» زیر باکس زمان صرف‌شده — آخرین رویداد `task.activityLog` را نشان می‌دهد؛ کلیک
 * روی آن مودال تمام‌صفحه‌ی کل فهرست را باز می‌کند (`ActivityLogDialog`). فقط‌خواندنی است، هیچ
 * رویداد تازه‌ای از خودِ فرم اضافه نمی‌شود.
 */
export function ActivityLogBox({ entries }: { entries: TaskActivityEntry[] }) {
  const t = useT()
  const latest = entries[0]

  return (
    <Dialog>
      <DialogTrigger
        disabled={entries.length === 0}
        className="flex w-full items-center gap-2 border-b border-border py-3 text-sm text-foreground hover:bg-bg2 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        <RemixIcon name="history-line" className="text-base text-icon2" />
        <span className="min-w-0 flex-1 truncate text-start">
          {latest ? latest.message : t("taskDetail.noActivity")}
        </span>
        {latest && <span className="shrink-0 text-xs text-text3">{latest.date}</span>}
      </DialogTrigger>
      <DialogContent variant="fullscreen" onClick={(event) => event.stopPropagation()}>
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle>{t("taskDetail.activityLog")}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-text2">{t("taskDetail.noActivity")}</p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-2 p-2">
                <RemixIcon name="history-line" className="mt-0.5 shrink-0 text-base text-icon2" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{entry.message}</p>
                  <span className="text-xs text-text3">{entry.date}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
