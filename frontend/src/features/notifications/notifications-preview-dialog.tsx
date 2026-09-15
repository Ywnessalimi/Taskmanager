"use client"

import Link from "next/link"
import { Popover, PopoverClose, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useT } from "@/components/providers/locale-provider"
import { STATUS_KEY, TARGET_ICON, VERB_KEY, formatRelativeTime } from "./notification-format"
import type { Notification } from "@/lib/api/types"

const PREVIEW_LIMIT = 5

/**
 * تریگر آیکون زنگوله‌ی اعلان‌ها در `DesktopHeader` — با کلیک، یک **پاپ‌آور** (نه مودال، بدون
 * پس‌زمینه‌ی تیره) دقیقاً کنار همان آیکون باز می‌شود که فقط خلاصه‌ی اعلان‌های خوانده‌نشده را
 * نشان می‌دهد (بدون کلیک روی ردیف‌ها، بدون تایید/رد — برای آن‌ها باید به خودِ صفحه‌ی اعلان‌ها
 * رفت) و پایینش دکمه‌ی «همه اعلان‌ها» به آن صفحه لینک می‌دهد. با کلیک روی هر نقطه‌ی دیگر
 * صفحه خودش بسته می‌شود (رفتار پیش‌فرض `Popover` غیرمودال).
 */
export function NotificationsPreviewDialog({ notifications }: { notifications: Notification[] }) {
  const t = useT()
  const unread = notifications.filter((n) => n.status === "unread").slice(0, PREVIEW_LIMIT)

  return (
    <Popover>
      <PopoverTrigger
        aria-label={t("nav.notifications")}
        className="relative flex size-8 items-center justify-center rounded-md text-icon2 hover:bg-bg2 hover:text-icon"
      >
        <RemixIcon name="notification-3-line" className="text-lg" />
        {unread.length > 0 && <span className="absolute end-1.5 top-1.5 size-1.5 rounded-full bg-brand" />}
      </PopoverTrigger>

      <PopoverContent className="flex w-80 flex-col gap-3 p-3">
        <PopoverTitle>{t("notifications.title")}</PopoverTitle>

        <div className="flex max-h-80 flex-col overflow-y-auto">
          {unread.map((notification, index) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 py-3 text-start ${index > 0 ? "border-t border-border" : ""}`}
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-bg2 text-icon2">
                <RemixIcon name={TARGET_ICON[notification.target.type]} className="text-base" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{notification.actorName}</span> {t(VERB_KEY[notification.verb])}
                  {notification.verb === "taskStatusChanged" && notification.verbStatus && (
                    <> {t(STATUS_KEY[notification.verbStatus])}</>
                  )}
                  <span className="text-text2"> · {notification.target.label}</span>
                </p>
                <p className="mt-0.5 text-xs text-text2">{formatRelativeTime(t, notification.createdAt)}</p>
              </div>
            </div>
          ))}

          {unread.length === 0 && <p className="py-6 text-center text-sm text-text2">{t("notifications.noUnread")}</p>}
        </div>

        <PopoverClose
          nativeButton={false}
          render={
            <Link
              href="/notifications"
              className="flex h-9 items-center justify-center rounded-md bg-bg2 text-sm font-medium text-foreground hover:bg-bg3"
            />
          }
        >
          {t("notifications.viewAll")}
        </PopoverClose>
      </PopoverContent>
    </Popover>
  )
}
