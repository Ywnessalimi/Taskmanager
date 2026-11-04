"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useLocale, useT } from "@/components/providers/locale-provider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RemixIcon } from "@/components/ui/remix-icon"
import { getMyTasks } from "@/lib/api/my-tasks"
import { getNotifications } from "@/lib/api/notifications"
import type { CurrentUser, MyTask, Notification } from "@/lib/api/types"
import { formatRelativeTime, TARGET_ICON, targetHref, VERB_KEY } from "@/features/notifications/notification-format"
import type { LocalTicket } from "@/features/tickets/local-created-tickets"
import type { TranslationKey } from "@/lib/i18n/dictionary"
import type { CustomInboxDashboard, InboxDashboardSlot, InboxWidgetType } from "./inbox-dashboard-provider"
import { useInboxDashboard } from "./inbox-dashboard-provider"

const widgetIcon: Record<InboxWidgetType, string> = {
  tickets: "chat-smile-line",
  tasks: "task-line",
  notifications: "notification-3-line",
}

function WidgetTitle({ type, count }: { type: InboxWidgetType; count?: number }) {
  const t = useT()
  const key = type === "tickets" ? "inboxDashboards.myTickets" : type === "tasks" ? "inboxDashboards.myTasks" : "inboxDashboards.myNotifications"
  return <div className="flex min-w-0 items-center gap-2">
    <RemixIcon name={widgetIcon[type]} className="shrink-0 text-base text-icon2" />
    <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{t(key)}</h3>
    {typeof count === "number" && <span className="shrink-0 text-xs tabular-nums text-text3">{count}</span>}
  </div>
}

function WidgetRows({ slot, tickets, tasks, notifications, loading, error }: {
  slot: InboxDashboardSlot
  tickets: LocalTicket[]
  tasks: MyTask[]
  notifications: Notification[]
  loading: boolean
  error: boolean
}) {
  const t = useT()
  const items = slot.widget === "tickets" ? tickets : slot.widget === "tasks" ? tasks : notifications
  if (!slot.widget) return null
  if (loading) return <p className="mt-3 text-xs text-text3">{t("inboxDashboards.loading")}</p>
  if (error) return <p role="alert" className="mt-3 text-xs text-error">{t("inboxDashboards.loadError")}</p>
  if (!items.length) return <p className="mt-3 text-xs text-text3">{t("inboxDashboards.noItems")}</p>

  if (slot.widget === "tickets") {
    const ticketRows = (items as LocalTicket[]).slice(0, 2)
    return <div className="mt-2 min-h-0 flex-1 divide-y divide-border overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {ticketRows.map((ticket) => <Link key={ticket.id} href={`/inbox/${encodeURIComponent(ticket.id)}`} className="flex min-h-7 items-center gap-2 text-start hover:text-brand">
        <RemixIcon name={ticket.status === "completed" ? "checkbox-circle-fill" : ticket.status === "in-progress" ? "play-circle-fill" : "checkbox-blank-circle-line"} className={`shrink-0 text-sm ${ticket.status === "completed" ? "text-success" : ticket.status === "in-progress" ? "text-brand" : "text-text3"}`} />
        <span className="min-w-0 flex-1 truncate text-xs">{ticket.title || t("ticket.name")}</span>
      </Link>)}
    </div>
  }

  if (slot.widget === "tasks") {
    return <div className="mt-2 min-h-0 flex-1 divide-y divide-border overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {(items as MyTask[]).slice(0, 2).map((task) => <Link key={task.id} href={`/tasks/${encodeURIComponent(task.id)}`} className="flex min-h-7 min-w-0 items-center gap-2 text-start hover:text-brand">
        <RemixIcon name={task.status === "completed" ? "checkbox-circle-fill" : task.status === "in-progress" ? "play-circle-fill" : "checkbox-blank-circle-line"} className={`shrink-0 text-sm ${task.status === "completed" ? "text-success" : task.status === "in-progress" ? "text-brand" : "text-text3"}`} />
        <span className="min-w-0 flex-1 truncate text-xs">{task.title}</span>
        <span className="hidden max-w-16 shrink-0 truncate text-[10px] text-text3 sm:inline">{task.projectName}</span>
      </Link>)}
    </div>
  }

  return <div className="mt-2 min-h-0 flex-1 divide-y divide-border overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    {(items as Notification[]).slice(0, 2).map((notification) => <Link key={notification.id} href={targetHref(notification.target)} className="flex min-h-7 min-w-0 items-center gap-2 text-start hover:text-brand">
      <RemixIcon name={TARGET_ICON[notification.target.type]} className="shrink-0 text-sm text-icon2" />
      <span className="min-w-0 flex-1 truncate text-xs">{notification.actorName ? `${notification.actorName} ` : ""}{t(VERB_KEY[notification.verb])}: {notification.target.label}</span>
      <span className="hidden shrink-0 text-[10px] text-text3 sm:inline">{formatRelativeTime(t, notification.createdAt)}</span>
    </Link>)}
  </div>
}

function SlotCard({ slot, tickets, tasks, notifications, loading, error, editing, onRemove }: {
  slot: InboxDashboardSlot
  tickets: LocalTicket[]
  tasks: MyTask[]
  notifications: Notification[]
  loading: boolean
  error: boolean
  editing: boolean
  onRemove: (slotId: string) => void
}) {
  const t = useT()
  const { selectDashboard } = useInboxDashboard()
  const count = slot.widget === "tickets" ? tickets.length : slot.widget === "tasks" ? tasks.length : slot.widget === "notifications" ? notifications.length : undefined

  if (!slot.widget) return null

  return <article className={`relative flex aspect-square min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-background p-2.5 ${editing ? "pt-10" : ""}`}>
    <div className="flex min-w-0 items-center justify-between gap-1">
      <WidgetTitle type={slot.widget} count={!loading && !error ? count : undefined} />
      {editing && <button type="button" onClick={() => onRemove(slot.id)} aria-label={t("inboxDashboards.removeWidget")} title={t("inboxDashboards.removeWidget")} className="absolute right-2 top-2 grid size-7 place-items-center rounded-md text-text3 hover:bg-bg2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"><RemixIcon name="delete-bin-line" className="text-base" /></button>}
    </div>
    <WidgetRows slot={slot} tickets={tickets} tasks={tasks} notifications={notifications} loading={loading} error={error} />
    <a href={slot.widget === "tickets" ? "/inbox" : slot.widget === "tasks" ? "/home/projects/MyTasks" : "/notifications"} onClick={() => { if (slot.widget === "tickets") selectDashboard("main") }} className="mt-auto flex min-h-8 items-center gap-1 border-t border-border pt-2 text-xs text-text2 hover:text-brand">
      {t("inboxDashboards.viewAll")}<RemixIcon name="arrow-left-line" className="text-sm rtl:rotate-180" />
    </a>
  </article>
}

const widgetChoices: { type: InboxWidgetType; icon: string; title: TranslationKey; description: TranslationKey }[] = [
  { type: "tickets", icon: widgetIcon.tickets, title: "inboxDashboards.myTickets", description: "inboxDashboards.ticketsDescription" },
  { type: "tasks", icon: widgetIcon.tasks, title: "inboxDashboards.myTasks", description: "inboxDashboards.tasksDescription" },
  { type: "notifications", icon: widgetIcon.notifications, title: "inboxDashboards.myNotifications", description: "inboxDashboards.notificationsDescription" },
]

type DashboardWidgetData = {
  signature: string
  tasks: MyTask[]
  notifications: Notification[]
  taskError: boolean
  notificationError: boolean
}

export function InboxDashboardCanvas({ dashboard, tickets, user, ticketLoadError, ticketLoading }: { dashboard: CustomInboxDashboard; tickets: LocalTicket[]; user: CurrentUser; ticketLoadError: boolean; ticketLoading: boolean }) {
  const t = useT()
  const { locale } = useLocale()
  const { saveSlots } = useInboxDashboard()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<InboxDashboardSlot[]>([])
  const [removeId, setRemoveId] = useState<string | null>(null)
  const slots = editing ? draft : dashboard.slots.filter((slot) => slot.widget)
  const [widgetData, setWidgetData] = useState<DashboardWidgetData | null>(null)
  const [pickerSlot, setPickerSlot] = useState<string | null>(null)
  const requiredWidgets = useMemo(() => slots.map((slot) => slot.widget).filter((widget): widget is InboxWidgetType => Boolean(widget)), [slots])
  const widgetSignature = [...new Set(requiredWidgets)].sort().join(",")

  useEffect(() => {
    if (!widgetSignature) return
    let active = true
    const taskRequest = widgetSignature.includes("tasks")
      ? getMyTasks().then((value) => ({ value, error: false as const })).catch(() => ({ value: [] as MyTask[], error: true as const }))
      : Promise.resolve({ value: [] as MyTask[], error: false as const })
    const notificationRequest = widgetSignature.includes("notifications")
      ? getNotifications(user.name).then((value) => ({ value, error: false as const })).catch(() => ({ value: [] as Notification[], error: true as const }))
      : Promise.resolve({ value: [] as Notification[], error: false as const })
    Promise.all([taskRequest, notificationRequest]).then(([taskResult, notificationResult]) => {
      if (!active) return
      setWidgetData({
        signature: widgetSignature,
        tasks: taskResult.value,
        notifications: notificationResult.value,
        taskError: taskResult.error,
        notificationError: notificationResult.error,
      })
    })
    return () => { active = false }
  }, [user.name, widgetSignature])

  const currentData = widgetData?.signature === widgetSignature ? widgetData : null
  const tasks = currentData?.tasks ?? []
  const notifications = currentData?.notifications ?? []
  const loading = Boolean(widgetSignature) && !currentData
  const widgetError = (widget: InboxWidgetType) => widget === "tasks" ? currentData?.taskError ?? false : widget === "notifications" ? currentData?.notificationError ?? false : ticketLoadError

  return <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-3 [scrollbar-width:thin]">
    <div className="mb-3 flex min-h-9 items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="truncate text-base font-medium text-foreground">{dashboard.name}</h2>
        {editing && <p className="mt-0.5 text-xs text-text3">{t("inboxDashboards.canvasHint")}</p>}
      </div>
      <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={() => { if (editing) { saveSlots(dashboard.id, draft); setEditing(false) } else { setDraft(dashboard.slots.filter((slot) => slot.widget)); setEditing(true) } }}><RemixIcon name={editing ? "check-line" : "edit-line"} />{t(editing ? "inboxDashboards.saveWidgets" : "inboxDashboards.editWidgets")}</Button>
    </div>
    {slots.length === 0 && !editing ? <div className="flex min-h-72 flex-col items-center justify-center gap-3 py-8 text-center">
      <Image src="/images/inbox-dashboards/empty-widgets-ui.webp" alt="" width={512} height={512} unoptimized className="size-44 object-contain" />
      <p className="text-sm text-text3">{t("inboxDashboards.noWidgets")}</p>
      <Button type="button" size="sm" className="rounded-full border-white px-4" onClick={() => { setDraft(dashboard.slots.filter((slot) => slot.widget)); setEditing(true); setPickerSlot("new") }}>
        <RemixIcon name="add-line" />{t("inboxDashboards.emptySlot")}
      </Button>
    </div> : <div className="grid grid-cols-2 gap-3 max-[360px]:grid-cols-1 sm:grid-cols-3 xl:grid-cols-4">
      {slots.map((slot) => <SlotCard key={slot.id} slot={slot} tickets={tickets} tasks={tasks} notifications={notifications} loading={slot.widget === "tickets" ? ticketLoading : loading} error={slot.widget ? widgetError(slot.widget) : false} editing={editing} onRemove={setRemoveId} />)}
      {editing && <button type="button" onClick={() => setPickerSlot("new")} aria-label={t("inboxDashboards.emptySlot")} className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background/70 text-text3 hover:text-brand focus-visible:outline-2 focus-visible:outline-ring"><span className="grid size-9 place-items-center rounded-full border border-border bg-background"><RemixIcon name="add-line" className="text-lg" /></span><span className="text-xs">{t("inboxDashboards.emptySlot")}</span></button>}
    </div>}
    <Dialog open={removeId !== null} onOpenChange={(open) => { if (!open) setRemoveId(null) }}>
      <DialogContent showCloseButton={false} className="gap-3 sm:max-w-sm">
        <DialogHeader className="text-start"><DialogTitle>{t("inboxDashboards.confirmRemove")}</DialogTitle><p className="text-sm text-text2">{t("inboxDashboards.confirmRemoveDescription")}</p></DialogHeader>
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setRemoveId(null)}>{t("inboxDashboards.cancel")}</Button><Button type="button" variant="destructive" onClick={() => { setDraft((current) => current.filter((slot) => slot.id !== removeId)); setRemoveId(null) }}>{t("inboxDashboards.removeWidget")}</Button></div>
      </DialogContent>
    </Dialog>
    <Dialog open={pickerSlot !== null} onOpenChange={(open) => { if (!open) setPickerSlot(null) }}>
      <DialogContent showCloseButton={false} className="gap-3 sm:max-w-md">
        <DialogHeader className="text-start">
          <DialogTitle className="text-base">{t("inboxDashboards.chooseWidget")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col divide-y divide-border">
          {widgetChoices.map((choice) => <button key={choice.type} type="button" onClick={() => { if (pickerSlot) setDraft((current) => [...current, { id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`, widget: choice.type }]); setPickerSlot(null) }} className="flex min-h-[68px] items-center gap-3 py-2 text-start hover:text-brand focus-visible:outline-2 focus-visible:outline-ring">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-background text-icon2"><RemixIcon name={choice.icon} className="text-lg" /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-foreground">{t(choice.title)}</span><span className="mt-1 block text-xs text-text3">{t(choice.description)}</span></span>
            <RemixIcon name={locale === "en" ? "arrow-right-s-line" : "arrow-left-s-line"} className="text-lg text-text3" />
          </button>)}
        </div>
      </DialogContent>
    </Dialog>
  </div>
}
