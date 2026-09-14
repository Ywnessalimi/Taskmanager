"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useT } from "@/components/providers/locale-provider"
import { Button } from "@/components/ui/button"
import { RemixIcon } from "@/components/ui/remix-icon"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { TranslationKey } from "@/lib/i18n/dictionary"
import type { Notification, NotificationVerb, TaskStatus } from "@/lib/api/types"

const FILTERS = [
  { id: "all", labelKey: "notifications.filterAll" },
  { id: "unread", labelKey: "notifications.filterUnread" },
  { id: "read", labelKey: "notifications.filterRead" },
  { id: "approval", labelKey: "notifications.filterApproval" },
] satisfies { id: string; labelKey: TranslationKey }[]

type FilterId = (typeof FILTERS)[number]["id"]

const TARGET_ICON: Record<Notification["target"]["type"], string> = {
  task: "task-line",
  project: "briefcase-line",
  organization: "building-4-line",
}

const VERB_KEY: Record<NotificationVerb, TranslationKey> = {
  taskAssigned: "notifications.verb.taskAssigned",
  taskCommented: "notifications.verb.taskCommented",
  projectJoinRequested: "notifications.verb.projectJoinRequested",
  orgAdminAssigned: "notifications.verb.orgAdminAssigned",
  taskStatusChanged: "notifications.verb.taskStatusChanged",
  projectCreated: "notifications.verb.projectCreated",
  orgMemberAdded: "notifications.verb.orgMemberAdded",
}

const STATUS_KEY: Record<TaskStatus, TranslationKey> = {
  todo: "status.todo",
  "in-progress": "status.inProgress",
  completed: "status.completed",
}

function formatRelativeTime(t: (key: TranslationKey) => string, value: Notification["createdAt"]): string {
  switch (value.unit) {
    case "yesterday":
      return t("time.yesterday")
    case "week":
      return t("time.aWeekAgo")
    case "hours":
      return `${value.amount} ${value.amount === 1 ? t("time.hour") : t("time.hours")} ${t("time.ago")}`
    case "days":
      return `${value.amount} ${value.amount === 1 ? t("time.day") : t("time.days")} ${t("time.ago")}`
  }
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
  const t = useT()
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
              {t(f.labelKey)}
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
                {notification.actorId ? (
                  <Link
                    href={`/users/${notification.actorId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium hover:text-brand hover:underline"
                  >
                    {notification.actorName}
                  </Link>
                ) : (
                  <span className="font-medium">{notification.actorName}</span>
                )}{" "}
                {t(VERB_KEY[notification.verb])}
                {notification.verb === "taskStatusChanged" && notification.verbStatus && (
                  <> {t(STATUS_KEY[notification.verbStatus])}</>
                )}
                <span className="text-text2"> · {notification.target.label}</span>
                {notification.requiresApproval && (
                  <span className="text-text2"> — {t("notifications.needsApproval")}</span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-text2">{formatRelativeTime(t, notification.createdAt)}</p>

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
                    {t("notifications.approve")}
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
                    {t("notifications.reject")}
                  </Button>
                </div>
              )}
            </div>

            {notification.status === "unread" && (
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-label={t("notifications.unreadAria")} />
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-text2">{t("notifications.empty")}</p>
        )}
      </div>
    </div>
  )
}
