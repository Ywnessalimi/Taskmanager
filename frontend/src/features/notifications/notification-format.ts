import type { Notification, NotificationVerb, TaskStatus } from "@/lib/api/types"
import type { TranslationKey } from "@/lib/i18n/dictionary"

/** آیکون هر ردیف اعلان بر اساس نوع مقصد — بین `NotificationList` و `NotificationsPreviewDialog` مشترک است. */
export const TARGET_ICON: Record<Notification["target"]["type"], string> = {
  task: "task-line",
  ticket: "chat-smile-line",
  project: "briefcase-line",
  organization: "building-4-line",
}

export const VERB_KEY: Record<NotificationVerb, TranslationKey> = {
  taskAssigned: "notifications.verb.taskAssigned",
  ticketAssigned: "notifications.verb.ticketAssigned",
  taskCommented: "notifications.verb.taskCommented",
  projectJoinRequested: "notifications.verb.projectJoinRequested",
  orgAdminAssigned: "notifications.verb.orgAdminAssigned",
  taskStatusChanged: "notifications.verb.taskStatusChanged",
  projectCreated: "notifications.verb.projectCreated",
  orgMemberAdded: "notifications.verb.orgMemberAdded",
}

export const STATUS_KEY: Record<TaskStatus, TranslationKey> = {
  todo: "status.todo",
  "in-progress": "status.inProgress",
  completed: "status.completed",
}

export function formatRelativeTime(t: (key: TranslationKey) => string, value: Notification["createdAt"]): string {
  if (typeof value === "string") {
    const createdAt = new Date(value).getTime()
    if (!Number.isFinite(createdAt)) return value
    const elapsedHours = Math.max(0, Math.floor((Date.now() - createdAt) / 3_600_000))
    if (elapsedHours < 1) return t("time.justNow")
    if (elapsedHours < 24) return `${elapsedHours} ${elapsedHours === 1 ? t("time.hour") : t("time.hours")} ${t("time.ago")}`
    const elapsedDays = Math.floor(elapsedHours / 24)
    if (elapsedDays === 1) return t("time.yesterday")
    if (elapsedDays >= 7) return t("time.aWeekAgo")
    return `${elapsedDays} ${t("time.days")} ${t("time.ago")}`
  }
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

export function targetHref(target: Notification["target"]) {
  switch (target.type) {
    case "task":
      return `/tasks/${encodeURIComponent(target.id)}`
    case "ticket":
      return `/inbox/${encodeURIComponent(target.id)}`
    case "project":
      return `/home/projects/${target.id}`
    case "organization":
      return `/home/organizations/${target.id}`
  }
}
