"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useLocale, useT } from "@/components/providers/locale-provider"
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RemixIcon } from "@/components/ui/remix-icon"
import { Checkbox } from "@/components/ui/checkbox"
import { MobileCreateMenu } from "@/features/tasks/mobile-create-menu"
import { STATUS_COLUMNS, STATUS_COLUMN_ICON } from "@/features/projects/task-display"
import type { LocalTicket } from "./local-created-tickets"
import { getInboxTickets } from "./ticket-data"
import type { CurrentUser, TaskPriority, TaskStatus } from "@/lib/api/types"
import type { TranslationKey } from "@/lib/i18n/dictionary"

const subjects = {
  general: "ticket.general",
  hr: "ticket.hr",
  purchasing: "ticket.purchasing",
  warehouse: "ticket.warehouse",
} as const

const statuses = {
  todo: "status.todo",
  "in-progress": "status.inProgress",
  completed: "status.completed",
} as const

const permissions = {
  "salary-payment": "ticket.salaryPayment",
  purchase: "ticket.purchase",
  "warehouse-release": "ticket.warehouseRelease",
  other: "ticket.other",
} as const

const statusIcons = {
  todo: "checkbox-blank-circle-line",
  "in-progress": "play-circle-fill",
  completed: "checkbox-circle-fill",
} as const

function StatusIcon({ status, className = "" }: { status: TaskStatus; className?: string }) {
  if (status === "in-progress") {
    return <span style={{ backgroundColor: "var(--project-status-green)" }} className={`grid size-[18px] shrink-0 place-items-center rounded-full ${className}`}><Image src="/images/figma/board/in-progress.svg" alt="" width={14} height={14} className="size-3.5" /></span>
  }
  return <RemixIcon name={STATUS_COLUMN_ICON[status]} className={`shrink-0 ${className}`} />
}

const statusClasses = {
  todo: "text-text3",
  "in-progress": "text-[var(--project-brand)]",
  completed: "text-success",
} as const

type InboxSort = "newest" | "oldest" | "highest-priority" | "lowest-priority"
const priorityRank: Record<TaskPriority, number> = { none: 0, low: 1, medium: 2, high: 3, urgent: 4 }

function ticketAvatar(ticket: LocalTicket, user: CurrentUser) {
  return ticket.createdByAvatarUrl ?? (ticket.createdById === user.id ? user.avatarUrl : undefined)
}

function assignedAvatar(ticket: LocalTicket) {
  return ticket.assigneeAvatarUrl
}

function TicketAvatar({ name, src, size }: { name: string; src?: string; size: "size-6" | "size-[29px]" }) {
  return <Avatar title={name} className={`${size} shrink-0 rounded-2xl`}>
    {src && <AvatarImage src={src} alt={name} />}
    <AvatarFallback className="rounded-2xl text-[10px]">{name.slice(0, 1)}</AvatarFallback>
  </Avatar>
}

function TicketCard({
  ticket,
  user,
  href = true,
  className = "",
  style,
}: {
  ticket: LocalTicket
  user: CurrentUser
  href?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  const t = useT()
  const { locale } = useLocale()
  const textDirection = locale === "en" ? "ltr" : "rtl"
  const assigneeAvatar = assignedAvatar(ticket)
  const content = (
    <>
      <AvatarGroup className="shrink-0 rtl:space-x-reverse">
        <TicketAvatar src={ticketAvatar(ticket, user)} name={ticket.createdByName ?? user.name} size="size-[29px]" />
        {ticket.assigneeName && <TicketAvatar src={assigneeAvatar} name={ticket.assigneeName} size="size-[29px]" />}
      </AvatarGroup>
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span dir={textDirection} className="w-full truncate text-start text-sm leading-5 text-[var(--task-workspace-text)]">
          {ticket.title || t("ticket.name")}
        </span>
        <span className="flex items-center gap-1 whitespace-nowrap text-xs leading-4 text-[var(--task-workspace-text)]">
          <RemixIcon name={statusIcons[ticket.status]} className={`${statusClasses[ticket.status]} text-sm`} />
          <span>{t(statuses[ticket.status])}</span>
          <span className="px-0.5 text-text3">·</span>
          <span className="text-text3">{t(subjects[ticket.subject])}</span>
        </span>
      </span>
    </>
  )

  const cardClassName = `flex h-[60px] w-full items-center gap-2 rounded-full border border-[var(--task-workspace-border)] bg-background px-4 py-2 text-start transition-colors hover:bg-bg2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${className}`
  const label = `${ticket.title || t("ticket.name")}, ${t(statuses[ticket.status])}, ${t(subjects[ticket.subject])}, ${ticket.createdByName ?? user.name}${ticket.assigneeName ? `, ${ticket.assigneeName}` : ""}`

  if (!href) {
    return (
      <div aria-hidden="true" className={cardClassName} style={style}>
        {content}
      </div>
    )
  }

  return (
    <Link
      href={`/inbox/${encodeURIComponent(ticket.id)}`}
      aria-label={label}
      className={cardClassName}
      style={style}
    >
      {content}
    </Link>
  )
}

function TicketCardList({
  tickets,
  user,
  t,
  hasAnyTickets,
  onScroll,
}: {
  tickets: LocalTicket[]
  user: CurrentUser
  t: ReturnType<typeof useT>
  hasAnyTickets: boolean
  onScroll?: (scrollTop: number) => void
}) {
  return (
    <div onScroll={(event) => onScroll?.(event.currentTarget.scrollTop)} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tickets.length === 0 ? (
        hasAnyTickets ? (
          <div className="flex min-h-full w-full items-center justify-center py-8">
            <p className="text-center text-[13px] text-[#262626]">{t("inbox.empty")}</p>
          </div>
        ) : (
          <div className="flex min-h-full w-full flex-col items-center justify-center gap-3 py-8">
            <Image src="/images/empty-mailbox.png" alt="" aria-hidden="true" width={1313} height={1198} className="h-auto w-[min(220px,55vw)]" />
            <p className="text-center text-[13px] text-[#262626]">{t("inbox.noTickets")}</p>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-2">
          {tickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} user={user} />)}
        </div>
      )}
    </div>
  )
}

export function TicketInbox({ user }: { user: CurrentUser }) {
  const t = useT()
  const { locale } = useLocale()
  const [tickets, setTickets] = useState<LocalTicket[]>([])
  const [error, setError] = useState(false)
  const [query, setQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [status, setStatus] = useState("all")
  const [subject, setSubject] = useState("all")
  const [owner, setOwner] = useState("all")
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [sort, setSort] = useState<InboxSort>("newest")
  const [profileCollapsed, setProfileCollapsed] = useState(false)
  const [ownerDialogOpen, setOwnerDialogOpen] = useState(false)
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false)
  const searchInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      try {
        setTickets(await getInboxTickets(locale))
        setError(false)
      } catch {
        setError(true)
      }
    }

    load()
    window.addEventListener("tickets-changed", load)
    window.addEventListener("storage", load)
    return () => {
      window.removeEventListener("tickets-changed", load)
      window.removeEventListener("storage", load)
    }
  }, [locale])

  useEffect(() => {
    if (searchOpen) searchInput.current?.focus()
  }, [searchOpen])

  const owners = Array.from(
    new Map(tickets.map((ticket) => [ticket.createdById ?? user.id, ticket.createdByName ?? user.name])).entries(),
  )
  const statusOptions: [string, string][] = STATUS_COLUMNS.map(({ id }) => [id, t(statuses[id])] as [string, string])
  const subjectOptions: [string, string][] = [
    ["general", t(subjects.general)],
    ["hr", t(subjects.hr)],
    ["purchasing", t(subjects.purchasing)],
    ["warehouse", t(subjects.warehouse)],
  ]
  const permissionOptions: [string, string][] = [
    ["salary-payment", t(permissions["salary-payment"])],
    ["purchase", t(permissions.purchase)],
    ["warehouse-release", t(permissions["warehouse-release"])],
    ["other", t(permissions.other)],
  ]
  const filtered = tickets.filter((ticket) =>
    (status === "all" || ticket.status === status)
    && (subject === "all" || ticket.subject === subject)
    && (owner === "all" || (ticket.createdById ?? user.id) === owner)
    && (selectedPermissions.length === 0 || selectedPermissions.some((selected) => ticket.permissionIds.includes(selected as keyof typeof permissions)))
    && `${ticket.title} ${ticket.description ?? ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  ).sort((a, b) => {
    if (sort === "newest") return Date.parse(b.createdAt) - Date.parse(a.createdAt)
    if (sort === "oldest") return Date.parse(a.createdAt) - Date.parse(b.createdAt)
    const priorityDifference = priorityRank[b.priority ?? "none"] - priorityRank[a.priority ?? "none"]
    if (priorityDifference) return sort === "highest-priority" ? priorityDifference : -priorityDifference
    return Date.parse(b.createdAt) - Date.parse(a.createdAt)
  })
  const hasActiveFilters = Boolean(query) || status !== "all" || subject !== "all" || owner !== "all" || selectedPermissions.length > 0

  function filter(
    label: TranslationKey,
    allLabel: TranslationKey,
    value: string,
    setValue: (next: string) => void,
    options: [string, string][],
    icon: string,
    mobile = false,
  ) {
    const selected = options.find(([id]) => id === value)?.[1]
    const triggerLabel = mobile
      ? (value === "all" ? t(allLabel) : selected)
      : (value === "all" ? t(label) : `${t(label)}: ${selected}`)
    const triggerIcon = label === "ticket.status" && value !== "all" ? STATUS_COLUMN_ICON[value as TaskStatus] : icon

    if (label === "ticket.permissions") {
      const selectedLabels = options.filter(([id]) => selectedPermissions.includes(id)).map(([, name]) => name)
      return (
        <button type="button" onClick={() => setPermissionDialogOpen(true)} className={`flex h-9 shrink-0 items-center gap-1.5 rounded-2xl border px-2.5 text-sm transition-colors ${selectedPermissions.length ? "border-transparent bg-[var(--project-filter-bg)] text-[var(--project-filter-fg)]" : "border-[var(--task-workspace-border)] bg-background text-[var(--task-workspace-muted)]"} ${mobile ? "" : "h-8 rounded-full px-3 text-xs"}`}>
          <RemixIcon name={icon} className="text-base" />
          <span className="max-w-48 truncate whitespace-nowrap">{selectedLabels.length ? selectedLabels.join("، ") : t(allLabel)}</span>
        </button>
      )
    }

    if (label === "inbox.user") {
      return (
        <button type="button" onClick={() => setOwnerDialogOpen(true)} className={`flex h-9 shrink-0 items-center gap-1.5 rounded-2xl border px-2.5 text-sm transition-colors ${value !== "all" ? "border-transparent bg-[var(--project-filter-bg)] text-[var(--project-filter-fg)]" : "border-[var(--task-workspace-border)] bg-background text-[var(--task-workspace-muted)]"} ${mobile ? "" : "h-8 rounded-full px-3 text-xs"}`}>
          <RemixIcon name={icon} className="text-base" />
          <span className="whitespace-nowrap">{triggerLabel}</span>
        </button>
      )
    }

    return (
      <DropdownMenu key={label}>
        <DropdownMenuTrigger
          className={`flex h-9 shrink-0 items-center gap-1.5 rounded-2xl border px-2.5 text-sm transition-colors ${
            value !== "all"
              ? "border-transparent bg-[var(--project-filter-bg)] text-[var(--project-filter-fg)]"
              : "border-[var(--task-workspace-border)] bg-background text-[var(--task-workspace-muted)]"
          } ${mobile ? "" : "h-8 rounded-full px-3 text-xs"}`}
        >
          {label === "ticket.status" && value !== "all"
            ? <StatusIcon status={value as TaskStatus} className="text-base" />
            : <RemixIcon name={triggerIcon} className="text-base" />}
          <span className="whitespace-nowrap">{triggerLabel}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="!w-72 max-w-[calc(100vw-1.5rem)]">
          <DropdownMenuRadioGroup value={value} onValueChange={setValue}>
            <DropdownMenuRadioItem value="all" className="whitespace-nowrap">{t(allLabel)}</DropdownMenuRadioItem>
            {options.map(([id, name]) => (
              <DropdownMenuRadioItem value={id} key={id} className="whitespace-nowrap">
                {label === "ticket.status" && <StatusIcon status={id as TaskStatus} className="me-2 text-base" />}
                {name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  function clearFilters() {
    setQuery("")
    setStatus("all")
    setSubject("all")
    setOwner("all")
    setSelectedPermissions([])
  }

  function sortFilter(mobile = false) {
    const options: [InboxSort, string][] = [
      ["newest", t("inbox.sortNewest")], ["oldest", t("inbox.sortOldest")],
      ["highest-priority", t("inbox.sortHighestPriority")], ["lowest-priority", t("inbox.sortLowestPriority")],
    ]
    return <DropdownMenu>
      <DropdownMenuTrigger className={`flex h-9 shrink-0 items-center gap-1.5 rounded-2xl border px-2.5 text-sm transition-colors ${sort !== "newest" ? "border-transparent bg-[var(--project-filter-bg)] text-[var(--project-filter-fg)]" : "border-[var(--task-workspace-border)] bg-background text-[var(--task-workspace-muted)]"} ${mobile ? "" : "h-8 rounded-full px-3 text-xs"}`}>
        <RemixIcon name="sort-desc" className="text-base" /><span className="whitespace-nowrap">{t("inbox.sort")}: {options.find(([id]) => id === sort)?.[1]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="!w-72 max-w-[calc(100vw-1.5rem)]">
        <DropdownMenuRadioGroup value={sort} onValueChange={value => setSort(value as InboxSort)}>
          {options.map(([id, label]) => <DropdownMenuRadioItem key={id} value={id} className="whitespace-nowrap">{label}</DropdownMenuRadioItem>)}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  }

  return (
    <>
      <Dialog open={ownerDialogOpen} onOpenChange={setOwnerDialogOpen}>
        <DialogContent variant="center" showCloseButton={false} className="!w-[calc(100vw-1rem)] !max-w-none overflow-hidden !p-0 sm:!w-[28rem] sm:!max-w-md">
          <DialogHeader className="relative border-b border-border px-4 py-4 pe-12 text-start">
            <DialogTitle className="text-base font-semibold">{t("inbox.selectUserTitle")}</DialogTitle>
            <p className="text-sm text-text3">{t("inbox.selectUserHint")}</p>
            <DialogClose aria-label={t("inbox.closeUserDialog")} className="absolute end-3 top-3 grid size-8 place-items-center rounded-lg text-text2 hover:bg-bg2"><RemixIcon name="close-line" className="text-lg" /></DialogClose>
          </DialogHeader>
          <div className="max-h-[60dvh] overflow-y-auto p-2">
            <button type="button" aria-pressed={owner === "all"} onClick={() => { setOwner("all"); setOwnerDialogOpen(false) }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start transition-colors hover:bg-bg2 ${owner === "all" ? "bg-bg2" : ""}`}>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand"><RemixIcon name="group-line" className="text-xl" /></span>
              <span className="min-w-0 flex-1 text-sm font-medium">{t("inbox.allUsers")}</span>
              {owner === "all" && <RemixIcon name="check-line" className="text-lg text-brand" />}
            </button>
            {owners.map(([id, name]) => {
              const selectedOwner = owner === id
              return (
                <button key={id} type="button" aria-pressed={selectedOwner} onClick={() => { setOwner(id); setOwnerDialogOpen(false) }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start transition-colors hover:bg-bg2 ${selectedOwner ? "bg-bg2" : ""}`}>
                  <Avatar className="size-10 shrink-0 rounded-full">
                    {id === user.id && user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={name} />}
                    <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
                  {selectedOwner && <RemixIcon name="check-line" className="text-lg text-brand" />}
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
        <DialogContent variant="center" showCloseButton={false} className="!w-[calc(100vw-1rem)] !max-w-none overflow-hidden !p-0 sm:!w-[28rem] sm:!max-w-md">
          <DialogHeader className="relative border-b border-border px-4 py-4 pe-12 text-start">
            <DialogTitle className="text-base font-semibold">{t("ticket.permissions")}</DialogTitle>
            <p className="text-sm text-text3">{t("inbox.selectPermissionsHint")}</p>
            <DialogClose aria-label={t("inbox.closeUserDialog")} className="absolute end-3 top-3 grid size-8 place-items-center rounded-lg text-text2 hover:bg-bg2"><RemixIcon name="close-line" className="text-lg" /></DialogClose>
          </DialogHeader>
          <div className="max-h-[60dvh] overflow-y-auto px-4">
            <label dir="ltr" className="flex min-h-12 cursor-pointer items-center justify-between gap-4 border-b border-border text-sm font-medium">
              <span dir={locale === "en" ? "ltr" : "rtl"} className="flex-1 text-start">{t("inbox.allPermissions")}</span>
              <Checkbox id="inbox-all-permissions" checked={selectedPermissions.length === 0} onCheckedChange={() => setSelectedPermissions([])} aria-label={t("inbox.allPermissions")} />
            </label>
            {permissionOptions.map(([id, name], index) => (
              <label key={id} dir="ltr" className={`flex min-h-12 cursor-pointer items-center justify-between gap-4 text-sm ${index < permissionOptions.length - 1 ? "border-b border-border" : ""}`}>
                <span dir={locale === "en" ? "ltr" : "rtl"} className="flex-1 text-start">{name}</span>
                <Checkbox id={`inbox-permission-${id}`} checked={selectedPermissions.includes(id)} onCheckedChange={(checked) => setSelectedPermissions((current) => checked ? [...current, id] : current.filter((item) => item !== id))} aria-label={name} />
              </label>
            ))}
          </div>
          <div className="border-t border-border p-3">
            <button type="button" onClick={() => setPermissionDialogOpen(false)} className="h-9 w-full rounded-md bg-brand text-sm font-medium text-text-on-brand">{t("inbox.applyFilters")}</button>
          </div>
        </DialogContent>
      </Dialog>


      <section className="mx-auto flex h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] w-full max-w-[800px] min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--project-surface)] lg:h-[calc(100dvh-3.5rem)] lg:max-h-[calc(100dvh-3.5rem)] lg:bg-transparent">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--task-workspace-border)] bg-background px-4 lg:hidden">
          {searchOpen ? (
            <>
              <input
                ref={searchInput}
                aria-label={t("inbox.search")}
                placeholder={t("inbox.search")}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text3"
              />
              <button type="button" onClick={() => { setSearchOpen(false); setQuery("") }} aria-label={t("inbox.closeSearch")} className="grid size-9 place-items-center text-text2">
                <RemixIcon name="close-line" className="text-xl" />
              </button>
            </>
          ) : (
            <>
              <h1 className="truncate text-base font-medium text-[var(--task-workspace-text)]">{user.name}</h1>
              <button type="button" onClick={() => setSearchOpen(true)} aria-label={t("inbox.search")} aria-expanded={searchOpen} className="grid size-9 place-items-center text-[var(--task-workspace-text)]">
                <RemixIcon name="search-line" className="text-xl" />
              </button>
            </>
          )}
        </header>

        <div className={`shrink-0 overflow-hidden px-4 transition-[max-height,opacity,padding] duration-300 ease-out ${profileCollapsed ? "max-h-0 pt-0 opacity-0" : "max-h-24 pt-4 opacity-100"}`}>
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center justify-start gap-2">
              {user.avatarUrl ? <Image src={user.avatarUrl} alt={user.name} width={52} height={52} unoptimized className="size-[52px] shrink-0 rounded-2xl object-cover" /> : <span className="grid size-[52px] shrink-0 place-items-center rounded-2xl bg-bg2 text-lg text-text2">{user.name.slice(0, 1)}</span>}
              <div dir={locale === "en" ? "ltr" : "rtl"} className="min-w-0 text-start">
                <h2 className="truncate text-xl font-medium leading-8 text-[var(--task-workspace-text)]">{user.name}</h2>
                <p className="truncate text-sm leading-5 text-[var(--task-workspace-muted)]">{t("inbox.welcome")}</p>
              </div>
            </div>
            <Link href="/account" aria-label={t("account.editProfileTitle")} className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--task-workspace-text)] text-white">
              <RemixIcon name="edit-2-fill" className="text-xl" />
            </Link>
          </div>
        </div>

        <div className="mt-3 flex h-11 shrink-0 items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sortFilter(true)}
          {filter("inbox.user", "inbox.allUsers", owner, setOwner, owners, "group-line", true)}
          {filter("ticket.status", "inbox.allStatuses", status, setStatus, statusOptions, "filter-3-line", true)}
          {filter("ticket.subject", "inbox.allSubjects", subject, setSubject, subjectOptions, "file-list-3-line", true)}
          {filter("ticket.permissions", "inbox.allPermissions", "all", () => {}, permissionOptions, "checkbox-blank-circle-line", true)}
          {hasActiveFilters && <button type="button" className="h-9 shrink-0 rounded-2xl px-2 text-xs text-text2" onClick={clearFilters}>{t("inbox.reset")}</button>}
        </div>

        {error && <p role="alert" className="shrink-0 px-4 pt-2 text-xs text-error">{t("ticket.error")}</p>}
        <TicketCardList key={filtered.map((ticket) => ticket.id).join(":")} tickets={filtered} user={user} t={t} hasAnyTickets={tickets.length > 0} onScroll={(scrollTop) => setProfileCollapsed(scrollTop > 12)} />

        <div className="lg:hidden"><MobileCreateMenu /></div>
      </section>
    </>
  )
}
