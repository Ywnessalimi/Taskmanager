import type { Notification, NotificationVerb, TaskStatus } from "@/lib/api/types"
import type { TranslationKey } from "@/lib/i18n/dictionary"

/** آیکون هر ردیف اعلان بر اساس نوع مقصد — بین `NotificationList` و `NotificationsPreviewDialog` مشترک است. */
export const TARGET_ICON: Record<Notification["target"]["type"], string> = {
  task: "task-line",
  project: "briefcase-line",
  organization: "building-4-line",
}

export const VERB_KEY: Record<NotificationVerb, TranslationKey> = {
  taskAssigned: "notifications.verb.taskAssigned",
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
      // صفحه‌ی جزئیات تسک هنوز ساخته نشده؛ فعلاً به پروژه‌ی همان تسک لینک می‌دهیم.
      return `/home/projects/${target.projectId}`
    case "project":
      return `/home/projects/${target.id}`
    case "organization":
      return `/home/organizations/${target.id}`
  }
}
