"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RemixIcon } from "@/components/ui/remix-icon"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Notification } from "@/lib/api/types"

const FILTERS = [
  { id: "all", label: "همه" },
  { id: "unread", label: "خوانده‌نشده" },
  { id: "read", label: "خوانده‌شده" },
  { id: "approval", label: "تایید" },
] as const

type FilterId = (typeof FILTERS)[number]["id"]

const TARGET_ICON: Record<Notification["target"]["type"], string> = {
  task: "task-line",
  project: "briefcase-line",
  organization: "building-4-line",
}

function targetHref(target: Notification["target"]) {
  switch (target.type) {
    case "task":
      // صفحه‌ی جزئیات تسک هنوز ساخته نشده؛ فعلاً به پروژه‌ی همان تسک لینک می‌دهیم.
      return `/home/projects/${target.projectId}`
    case "project":
      return `/home/projects/${target.id}`
    case "organization":
      return `/home/organizations/${target.id}`
  }
}

export function NotificationList({ notifications: initial }: { notifications: Notification[] }) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initial)
  const [filter, setFilter] = useState<FilterId>("all")

  const filtered = useMemo(() => {
    switch (filter) {
      case "unread":
        return notifications.filter((n) => n.status === "unread")
      case "read":
        return notifications.filter((n) => n.status === "read")
      case "approval":
        return notifications.filter((n) => n.requiresApproval)
      default:
        return notifications
    }
  }, [notifications, filter])

  function openNotification(notification: Notification) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, status: "read" } : n))
    )
    router.push(targetHref(notification.target))
  }

  function resolveApproval(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, requiresApproval: false, status: "read" } : n))
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterId)}>
        <TabsList variant="line" className="w-fit">
          {FILTERS.map((f) => (
            <TabsTrigger key={f.id} value={f.id}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col rounded-md border border-border bg-background px-3">
        {filtered.map((notification, index) => (
          <div
            key={notification.id}
            role="button"
            tabIndex={0}
            onClick={() => openNotification(notification)}
            onKeyDown={(e) => e.key === "Enter" && openNotification(notification)}
            className={`flex items-start gap-3 py-3 text-start ${index > 0 ? "border-t border-border" : ""}`}
          >
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-bg2 text-icon2">
              <RemixIcon name={TARGET_ICON[notification.target.type]} className="text-base" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">
                <span className="font-medium">{notification.actorName}</span> {notification.verb}
                {notification.target.type !== "task" && (
                  <span className="text-text2"> · {notification.target.label}</span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-text2">{notification.createdAtLabel}</p>

              {notification.requiresApproval && (
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      resolveApproval(notification.id)
                    }}
                  >
                    تایید
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      resolveApproval(notification.id)
                    }}
                  >
                    رد
                  </Button>
                </div>
              )}
            </div>

            {notification.status === "unread" && (
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-label="خوانده‌نشده" />
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-text2">اعلانی در این فیلتر وجود ندارد.</p>
        )}
      </div>
    </div>
  )
}
