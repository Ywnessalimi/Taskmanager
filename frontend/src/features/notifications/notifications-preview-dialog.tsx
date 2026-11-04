"use client"

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverClose, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useT } from "@/components/providers/locale-provider"
import { STATUS_KEY, VERB_KEY, formatRelativeTime, targetHref } from "./notification-format"
import { markNotificationRead } from "@/lib/api/notifications"
import type { Notification, TaskFormProjectOption, TaskPriority } from "@/lib/api/types"

type NotificationCategory = "all" | Notification["target"]["type"]
type NotificationPriority = "all" | TaskPriority
type SavedNotificationFilter = { id: string; name: string; actorKeys: string[]; category: NotificationCategory; priority: NotificationPriority }

const FILTER_STORAGE_PREFIX = "quire.notifications.filters.v1"
const FILTER_CHANGE_EVENT = "quire-notification-filters-changed"
const EMPTY_SAVED_FILTERS: SavedNotificationFilter[] = []
const savedFilterCache = new Map<string, { raw: string | null; value: SavedNotificationFilter[] }>()
const savedFilterMemory = new Map<string, SavedNotificationFilter[]>()

function notificationProjectId(n: Notification) {
  return n.target.type === "task" || n.target.type === "ticket" ? n.target.projectId : n.target.type === "project" ? n.target.id : undefined
}

function parseSavedFilters(raw: string | null): SavedNotificationFilter[] {
  try {
    const value: unknown = JSON.parse(raw ?? "[]")
    if (!Array.isArray(value)) return []
    return value.filter((item) => Boolean(item && typeof item === "object"
      && typeof item.id === "string" && typeof item.name === "string"
      && (typeof item.actorKey === "string" || (Array.isArray(item.actorKeys) && item.actorKeys.every((key: unknown) => typeof key === "string")))
      && ["all", "task", "ticket", "project", "organization"].includes(item.category)
      && ["all", "none", "urgent", "high", "medium", "low"].includes(item.priority)))
      .map((item) => ({
        id: item.id,
        name: item.name,
        actorKeys: Array.isArray(item.actorKeys) ? item.actorKeys : item.actorKey === "all" ? [] : [item.actorKey],
        category: item.category,
        priority: item.priority,
      }))
  } catch {
    return []
  }
}

function getSavedFilters(key: string): SavedNotificationFilter[] {
  try {
    const raw = window.localStorage.getItem(key)
    const cached = savedFilterCache.get(key)
    if (cached?.raw === raw) return cached.value
    const value = raw === null ? savedFilterMemory.get(key) ?? EMPTY_SAVED_FILTERS : parseSavedFilters(raw)
    savedFilterCache.set(key, { raw, value })
    return value
  } catch {
    return savedFilterMemory.get(key) ?? EMPTY_SAVED_FILTERS
  }
}

function subscribeSavedFilters(key: string, onChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== key && event.key !== null) return
    savedFilterCache.delete(key)
    onChange()
  }
  const handleLocalChange = (event: Event) => {
    if ((event as CustomEvent<string>).detail !== key) return
    savedFilterCache.delete(key)
    onChange()
  }
  window.addEventListener("storage", handleStorage)
  window.addEventListener(FILTER_CHANGE_EVENT, handleLocalChange)
  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(FILTER_CHANGE_EVENT, handleLocalChange)
  }
}

function writeSavedFilters(key: string, filters: SavedNotificationFilter[]) {
  savedFilterMemory.set(key, filters)
  let raw: string | null = null
  try {
    raw = JSON.stringify(filters)
    window.localStorage.setItem(key, raw)
  } catch { /* Keep saved filters available for this tab when browser storage is unavailable. */ }
  savedFilterCache.set(key, { raw, value: filters })
  window.dispatchEvent(new CustomEvent(FILTER_CHANGE_EVENT, { detail: key }))
}

function FilterChips<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string }[]; onChange: (value: T) => void }) {
  return <fieldset className="flex flex-col gap-2 border-b border-border pb-4">
    <legend className="mb-2 text-sm font-medium text-foreground">{label}</legend>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => <button key={option.id} type="button" aria-pressed={value === option.id} onClick={() => onChange(option.id)} className={`min-h-9 rounded-full border px-4 text-sm transition-colors ${value === option.id ? "border-foreground bg-foreground text-background" : "border-transparent bg-bg2 text-foreground hover:bg-bg3"}`}>{option.label}</button>)}
    </div>
  </fieldset>
}

function ActorMultiSelect({ actors, selectedIds, onChange, label, placeholder, removeLabel }: {
  actors: { id: string; name: string }[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  label: string
  placeholder: string
  removeLabel: (name: string) => string
}) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const options = actors.filter((actor) => !selectedIds.includes(actor.id) && actor.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer)
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer)
  }, [])

  return <div ref={rootRef} className="relative flex flex-col gap-2 border-b border-border pb-4">
    <label htmlFor="notification-filter-actors" className="text-sm font-medium text-foreground">{label}</label>
    <input id="notification-filter-actors" role="combobox" aria-expanded={open} aria-controls="notification-filter-actor-options" aria-autocomplete="list" value={query} onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setOpen(true) }} onKeyDown={(event) => {
      if (event.key === "Escape") setOpen(false)
      if (event.key === "Enter" && options[0]) { event.preventDefault(); onChange([...selectedIds, options[0].id]); setQuery("") }
    }} placeholder={selectedIds.length ? placeholder : placeholder} className="h-10 rounded-full border border-input bg-background px-4 text-sm outline-none placeholder:text-text3 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" />
    {selectedIds.length > 0 && <div className="flex flex-wrap gap-2" aria-label={label}>
      {selectedIds.map((id) => {
        const actor = actors.find((item) => item.id === id)
        if (!actor) return null
        return <span key={id} className="inline-flex min-h-8 items-center gap-1 rounded-full bg-bg2 py-1 ps-3 pe-1 text-sm text-foreground">
          {actor.name}
          <button type="button" aria-label={removeLabel(actor.name)} onClick={() => onChange(selectedIds.filter((selected) => selected !== id))} className="grid size-6 place-items-center rounded-full text-text2 hover:bg-bg3 hover:text-foreground"><RemixIcon name="close-line" className="text-base" /></button>
        </span>
      })}
    </div>}
    {open && options.length > 0 && <div id="notification-filter-actor-options" role="listbox" aria-label={label} className="absolute inset-x-0 top-[4.5rem] z-20 max-h-48 overflow-y-auto rounded-xl border border-border bg-background p-1 shadow-md">
      {options.map((actor) => <button key={actor.id} type="button" role="option" aria-selected={false} onClick={() => { onChange([...selectedIds, actor.id]); setQuery(""); setOpen(true) }} className="flex min-h-9 w-full items-center rounded-lg px-3 text-start text-sm text-foreground hover:bg-bg2">{actor.name}</button>)}
    </div>}
  </div>
}

function NotificationRows({ notifications, projects, recipientName, readIds, setReadIds, closePopover = false }: { notifications: Notification[]; projects: TaskFormProjectOption[]; recipientName: string; readIds: string[]; setReadIds: (update: (ids: string[]) => string[]) => void; closePopover?: boolean }) {
  const t = useT()
  const isUnread = (n: Notification) => n.status === "unread" && !readIds.includes(n.id)
  return <>
    {notifications.map((notification, index) => {
      const projectId = notification.target.type === "task" || notification.target.type === "ticket" ? notification.target.projectId : notification.target.type === "project" ? notification.target.id : undefined
      const project = projects.find((option) => option.id === projectId)
      const member = projects.flatMap((option) => option.members).find((person) => person.name === notification.actorName)
      const row = <Link key={notification.id} href={targetHref(notification.target)} onClick={() => { if (notification.status === "unread") { setReadIds((ids) => [...ids, notification.id]); void markNotificationRead(notification.id, recipientName).catch(() => {}) } }} className={`flex min-h-16 w-full items-center gap-4 py-2 text-start hover:bg-bg2 ${index < notifications.length - 1 ? "border-b border-border" : ""}`}>
        <Avatar className="size-8 shrink-0"><AvatarImage src={member?.avatarUrl} /><AvatarFallback>{notification.actorName?.slice(0, 1) ?? "?"}</AvatarFallback></Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-sm leading-5 text-foreground"><span className="font-semibold">{notification.actorName}</span> {t(VERB_KEY[notification.verb])}{notification.verb === "taskStatusChanged" && notification.verbStatus && <> {t(STATUS_KEY[notification.verbStatus])}</>} <span className="font-semibold">{notification.target.label}</span></p>
          <p className="flex flex-wrap items-center gap-2 text-sm leading-5 text-text3"><span>{formatRelativeTime(t, notification.createdAt)}</span><Image src="/images/figma/notifications/separator.svg" alt="" width={4} height={4} /><span>{project?.name ?? notification.target.label}</span></p>
        </div>
        <span className="flex w-7 shrink-0 justify-center">{isUnread(notification) && <Image src="/images/figma/notifications/unread.svg" alt="" width={12} height={12} />}</span>
      </Link>
      return closePopover ? <PopoverClose key={notification.id} nativeButton={false} render={row} /> : row
    })}
    {notifications.length === 0 && <p className="py-6 text-center text-sm text-text2">{t("notifications.empty")}</p>}
  </>
}

/** نمای کامل صفحه از همان فهرست و فیلترهای پیش‌نمایش هدر استفاده می‌کند. */
export function NotificationsFullPage({ notifications, projects = [], recipientName, recipientId }: { notifications: Notification[]; projects?: TaskFormProjectOption[]; recipientName: string; recipientId: string }) {
  const t = useT()
  const [readIds, setReadIds] = useState<string[]>([])
  const [filter, setFilter] = useState("all")
  const [createFilterOpen, setCreateFilterOpen] = useState(false)
  const [filterName, setFilterName] = useState("")
  const [editingFilterId, setEditingFilterId] = useState<string | null>(null)
  const [actorKeys, setActorKeys] = useState<string[]>([])
  const [category, setCategory] = useState<NotificationCategory>("all")
  const [priority, setPriority] = useState<NotificationPriority>("all")
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppressTabClick = useRef(false)
  const storageKey = `${FILTER_STORAGE_PREFIX}:${encodeURIComponent(recipientId)}`
  const savedFilters = useSyncExternalStore(
    (onChange) => subscribeSavedFilters(storageKey, onChange),
    () => getSavedFilters(storageKey),
    () => EMPTY_SAVED_FILTERS,
  )
  useEffect(() => () => { if (longPressTimer.current) clearTimeout(longPressTimer.current) }, [])
  const groups = projects.filter((project) => notifications.some((n) => notificationProjectId(n) === project.id))
  const actors = useMemo(() => [...new Map(notifications.filter((n) => n.actorId || n.actorName).map((n) => [n.actorId ?? n.actorName ?? "", { id: n.actorId ?? n.actorName ?? "", name: n.actorName ?? "" }])).values()], [notifications])
  const visible = useMemo(() => {
    if (filter === "all") return notifications
    if (filter === "unread-tasks") return notifications.filter((n) => n.target.type === "task" && n.status === "unread" && !readIds.includes(n.id))
    if (filter.startsWith("project:")) return notifications.filter((n) => notificationProjectId(n) === filter.slice("project:".length))
    if (!filter.startsWith("custom:")) return notifications
    const saved = savedFilters.find((item) => item.id === filter.slice("custom:".length))
    if (!saved) return notifications
    return notifications.filter((n) => {
      const actualActor = n.actorId ?? n.actorName ?? ""
      return (saved.actorKeys.length === 0 || saved.actorKeys.includes(actualActor))
        && (saved.category === "all" || saved.category === n.target.type)
        && (saved.priority === "all" || (n.target.type === "task" && n.target.priority === saved.priority))
    })
  }, [filter, notifications, readIds, savedFilters])
  const categoryOptions: { id: NotificationCategory; label: string }[] = [
    { id: "all", label: t("notifications.allCategories") },
    { id: "task", label: t("notifications.category.task") },
    { id: "ticket", label: t("notifications.category.ticket") },
    { id: "project", label: t("notifications.category.project") },
    { id: "organization", label: t("notifications.category.organization") },
  ]
  const priorityOptions: { id: NotificationPriority; label: string }[] = [
    { id: "all", label: t("notifications.allPriorities") },
    { id: "none", label: t("notifications.priority.none") },
    { id: "urgent", label: t("notifications.priority.urgent") },
    { id: "high", label: t("notifications.priority.high") },
    { id: "medium", label: t("notifications.priority.medium") },
    { id: "low", label: t("notifications.priority.low") },
  ]

  function createFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = filterName.trim()
    if (!name) return
    const filterId = editingFilterId ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`
    const next = editingFilterId
      ? savedFilters.map((item) => item.id === editingFilterId ? { ...item, name, actorKeys, category, priority } : item)
      : [...savedFilters, { id: filterId, name, actorKeys, category, priority }]
    writeSavedFilters(storageKey, next)
    setFilter(`custom:${filterId}`)
    closeFilterEditor()
  }

  function closeFilterEditor() {
    setCreateFilterOpen(false)
    setFilterName("")
    setEditingFilterId(null)
    setActorKeys([])
    setCategory("all")
    setPriority("all")
  }

  function startCreateFilter() {
    setEditingFilterId(null)
    setFilterName("")
    setActorKeys([])
    setCategory("all")
    setPriority("all")
    setCreateFilterOpen(true)
  }

  function startEditFilter(saved: SavedNotificationFilter) {
    setEditingFilterId(saved.id)
    setFilterName(saved.name)
    setActorKeys(saved.actorKeys)
    setCategory(saved.category)
    setPriority(saved.priority)
    setCreateFilterOpen(true)
  }

  function deleteEditedFilter() {
    if (!editingFilterId) return
    const deletedId = editingFilterId
    writeSavedFilters(storageKey, savedFilters.filter((saved) => saved.id !== deletedId))
    setFilter((current) => current === `custom:${deletedId}` ? "all" : current)
    closeFilterEditor()
  }

  function stopLongPress() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
    longPressTimer.current = null
  }

  return <section className="flex min-h-0 flex-1 flex-col bg-background">
    <h1 className="px-4 py-4 text-base font-semibold">{t("notifications.title")}</h1>
    <Tabs value={filter} onValueChange={(value) => setFilter(value as string)} className="min-h-0 flex-1 gap-0">
      <div className="flex h-12 shrink-0 items-center gap-3 border-y border-border px-4">
        <TabsList variant="line" className="group-data-horizontal/tabs:h-full min-w-0 flex-1 justify-start gap-4 overflow-x-auto p-0 [scrollbar-width:none]">
          {[{ id: "all", name: t("notifications.viewAll"), saved: undefined }, { id: "unread-tasks", name: t("notifications.unreadTasks"), saved: undefined }, ...groups.map((project) => ({ id: `project:${project.id}`, name: project.name, saved: undefined })), ...savedFilters.map((saved) => ({ id: `custom:${saved.id}`, name: saved.name, saved }))].map((group) => <TabsTrigger key={group.id} value={group.id} onPointerDown={(event) => {
            if (!group.saved || event.pointerType !== "touch") return
            stopLongPress()
            longPressTimer.current = setTimeout(() => { suppressTabClick.current = true; startEditFilter(group.saved!) }, 550)
          }} onPointerUp={stopLongPress} onPointerLeave={stopLongPress} onPointerCancel={stopLongPress} onClick={(event) => {
            if (!suppressTabClick.current) return
            suppressTabClick.current = false
            event.preventDefault()
            event.stopPropagation()
          }} onContextMenu={(event) => {
            if (!group.saved) return
            event.preventDefault()
            event.stopPropagation()
            startEditFilter(group.saved)
          }} className="h-full flex-none rounded-none border-0 px-0 text-xs after:rounded-t-[4px] after:bg-[#141a1a] group-data-horizontal/tabs:after:bottom-0 group-data-horizontal/tabs:after:h-[5px]">{group.name}</TabsTrigger>)}
        </TabsList>
        <Button type="button" variant="outline" size="icon-sm" aria-label={t("notifications.createFilter")} title={t("notifications.createFilter")} className="shrink-0 rounded-full" onClick={startCreateFilter}><RemixIcon name="add-line" /></Button>
      </div>
      <TabsContent value={filter} className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-4">
        <NotificationRows notifications={visible} projects={projects} recipientName={recipientName} readIds={readIds} setReadIds={setReadIds} />
      </TabsContent>
    </Tabs>
    <Dialog open={createFilterOpen} onOpenChange={(open) => { if (open) setCreateFilterOpen(true); else closeFilterEditor() }}>
      <DialogContent className="max-h-[90dvh] gap-0 overflow-y-auto rounded-2xl border border-border p-5 shadow-none sm:max-w-xl sm:p-7">
        <DialogHeader className="mb-5 text-start">
          <DialogTitle className="text-base">{t(editingFilterId ? "notifications.editFilterTitle" : "notifications.filterTitle")}</DialogTitle>
          <p className="text-sm leading-6 text-text2">{t("notifications.filterDescription")}</p>
        </DialogHeader>
        <form onSubmit={createFilter} className="flex flex-col gap-5">
          <label className="flex flex-col gap-2 border-b border-border pb-4 text-sm font-medium text-foreground">
            {t("notifications.filterName")}
            <input autoFocus maxLength={32} value={filterName} onChange={(event) => setFilterName(event.target.value)} placeholder={t("notifications.filterName")} className="h-10 rounded-full border border-input bg-background px-4 text-sm font-normal outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" />
          </label>
          <ActorMultiSelect actors={actors} selectedIds={actorKeys} onChange={setActorKeys} label={t("notifications.filterActor")} placeholder={t("notifications.searchActors")} removeLabel={(name) => t("notifications.removeActor").replace("{name}", name)} />
          <FilterChips label={t("notifications.filterCategory")} value={category} options={categoryOptions} onChange={setCategory} />
          <FilterChips label={t("notifications.filterPriority")} value={priority} options={priorityOptions} onChange={setPriority} />
          <div className="flex items-center gap-3">
            {editingFilterId && <Button type="button" variant="ghost" onClick={deleteEditedFilter} className="text-destructive hover:text-destructive"><RemixIcon name="delete-bin-line" />{t("notifications.deleteFilter")}</Button>}
            <Button type="submit" size="lg" disabled={!filterName.trim()} className="h-11 flex-1 rounded-full border border-white bg-[#292929] text-white hover:bg-[#3b3b3b]">{t("notifications.saveFilter")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </section>
}

/** پیش‌نمایش Figma 1723:29972، با فیلتر پروژه و خواندن محلی اعلان‌ها. */
export function NotificationsPreviewDialog({ notifications, projects = [], iconSrc, recipientName }: { notifications: Notification[]; projects?: TaskFormProjectOption[]; iconSrc?: string; recipientName: string }) {
  const t = useT()
  const [readIds, setReadIds] = useState<string[]>([])
  const [filter, setFilter] = useState("all")
  const groups = projects.filter((project) => notifications.some((n) => notificationProjectId(n) === project.id))
  const visible = notifications.filter((n) => filter === "all" || notificationProjectId(n) === filter)
  const isUnread = (n: Notification) => n.status === "unread" && !readIds.includes(n.id)

  return (
    <Popover>
      <PopoverTrigger aria-label={t("nav.notifications")} className="relative flex size-8 items-center justify-center rounded-md text-icon2 hover:bg-bg2 hover:text-icon">
        {iconSrc ? <Image src={iconSrc} alt="" width={20} height={20} /> : <RemixIcon name="notification-3-line" className="text-lg" />}
        {notifications.some(isUnread) && <span className="absolute end-1.5 top-1.5 size-1.5 rounded-full bg-brand" />}
      </PopoverTrigger>
      <PopoverContent className="flex w-[393px] max-w-[calc(100vw-2rem)] flex-col gap-[11px] overflow-hidden rounded-2xl bg-background pt-4 shadow-none ring-1 ring-border">
        <div className="flex items-center justify-between px-4">
          <PopoverTitle className="text-start text-base font-semibold leading-5">{t("notifications.title")}</PopoverTitle>
          <PopoverClose nativeButton={false} render={<Link href="/notifications" aria-label={t("notifications.openFullPage")} title={t("notifications.openFullPage")} className="flex size-8 shrink-0 items-center justify-center rounded-md text-icon2 hover:bg-bg2 hover:text-foreground" />}>
            <RemixIcon name="expand-diagonal-line" className="text-lg" />
          </PopoverClose>
        </div>
        <Tabs value={filter} onValueChange={(value) => setFilter(value as string)} className="gap-0">
          <div className="flex h-12 items-center gap-4 border-y border-border px-4">
            <TabsList variant="line" className="group-data-horizontal/tabs:h-full min-w-0 flex-1 justify-start gap-4 overflow-x-auto p-0 [scrollbar-width:none]">
              {[{ id: "all", name: t("notifications.viewAll") }, ...groups.map((project) => ({ id: project.id, name: project.name }))].map((group) => (
                <TabsTrigger key={group.id} value={group.id} className="h-full flex-none rounded-none border-0 px-0 text-xs after:rounded-t-[4px] after:bg-[#141a1a] group-data-horizontal/tabs:after:bottom-0 group-data-horizontal/tabs:after:h-[5px]">{group.name}</TabsTrigger>
              ))}
            </TabsList>
          </div>
          <TabsContent value={filter} className="max-h-[min(480px,60vh)] overflow-y-auto px-4 pb-4">
            <NotificationRows notifications={visible} projects={projects} recipientName={recipientName} readIds={readIds} setReadIds={setReadIds} closePopover />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
