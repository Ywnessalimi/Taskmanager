"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState, type TouchEvent, type WheelEvent } from "react"
import { useLocale, useT } from "@/components/providers/locale-provider"
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RemixIcon } from "@/components/ui/remix-icon"
import type { LocalTicket } from "./local-created-tickets"
import { getTickets } from "./ticket-data"
import type { CurrentUser } from "@/lib/api/types"
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

const statusClasses = {
  todo: "text-text3",
  "in-progress": "text-[var(--project-brand)]",
  completed: "text-success",
} as const

const avatarByOwner: Record<string, string> = {
  u1: "/avatars/u1.svg",
  u2: "/avatars/u2.svg",
  u3: "/avatars/u3.svg",
  u4: "/avatars/u4.svg",
  u5: "/avatars/u5.svg",
  u6: "/avatars/u6.svg",
}

function ticketAvatar(ticket: LocalTicket, user: CurrentUser) {
  if (ticket.createdByAvatarUrl) return ticket.createdByAvatarUrl
  if (ticket.createdById === user.id) return user.avatarUrl ?? avatarByOwner.u1
  return (ticket.createdById && avatarByOwner[ticket.createdById]) || user.avatarUrl || avatarByOwner.u1
}

function assignedAvatar(ticket: LocalTicket) {
  return ticket.assigneeAvatarUrl ?? (ticket.assigneeId ? avatarByOwner[ticket.assigneeId] : undefined)
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
  const assigneeAvatar = assignedAvatar(ticket)
  const content = (
    <>
      <AvatarGroup className="shrink-0 rtl:space-x-reverse">
        <TicketAvatar src={ticketAvatar(ticket, user)} name={ticket.createdByName ?? user.name} size="size-[29px]" />
        {ticket.assigneeName && <TicketAvatar src={assigneeAvatar} name={ticket.assigneeName} size="size-[29px]" />}
      </AvatarGroup>
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className="w-full truncate text-right text-sm leading-5 text-[var(--task-workspace-text)]">
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

function TicketCardStack({
  tickets,
  user,
  t,
}: {
  tickets: LocalTicket[]
  user: CurrentUser
  t: ReturnType<typeof useT>
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [stackActive, setStackActive] = useState(false)
  const stackSize = Math.min(6, tickets.length)
  const regularTickets = stackActive ? tickets.slice(0, tickets.length - stackSize) : tickets
  const deckTickets = stackActive ? tickets.slice(-stackSize) : []
  const [peeledCount, setPeeledCount] = useState(0)
  const [isPeelingTop, setIsPeelingTop] = useState(false)
  const isPeelingRef = useRef(false)
  const touchStartY = useRef<number | null>(null)
  const timer = useRef<number | null>(null)
  const remaining = deckTickets.slice(peeledCount)

  useEffect(() => {
    const container = scrollRef.current
    if (!container || stackActive || tickets.length < 6) return

    function activateIfAtBottom() {
      const node = scrollRef.current
      if (!node || node.scrollHeight <= node.clientHeight + 1) return
      if (node.scrollTop + node.clientHeight >= node.scrollHeight - 8) setStackActive(true)
    }

    const observer = new ResizeObserver(activateIfAtBottom)
    observer.observe(container)
    if (container.firstElementChild instanceof HTMLElement) observer.observe(container.firstElementChild)
    const frame = window.requestAnimationFrame(activateIfAtBottom)
    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [stackActive, tickets.length])

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
  }, [])

  function peelTopCard() {
    if (!remaining.length || isPeelingRef.current) return
    isPeelingRef.current = true
    setIsPeelingTop(true)
    timer.current = window.setTimeout(() => {
      setPeeledCount((count) => Math.min(deckTickets.length, count + 1))
      setIsPeelingTop(false)
      isPeelingRef.current = false
      timer.current = null
    }, 230)
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    if (event.deltaY <= 0 || !remaining.length) return
    event.preventDefault()
    peelTopCard()
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartY.current = event.touches[0]?.clientY ?? null
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const endY = event.changedTouches[0]?.clientY
    if (touchStartY.current !== null && endY !== undefined && touchStartY.current - endY > 28) {
      peelTopCard()
    }
    touchStartY.current = null
  }

  function handleListScroll() {
    const container = scrollRef.current
    if (!container || stackActive || tickets.length < 6) return
    if (
      container.scrollHeight > container.clientHeight + 1
      && container.scrollTop + container.clientHeight >= container.scrollHeight - 8
    ) {
      setStackActive(true)
    }
  }

  return (
    <div ref={scrollRef} onScroll={handleListScroll} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tickets.length === 0 ? (
        <p className="pt-10 text-center text-sm text-text3">{t("inbox.empty")}</p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {regularTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} user={user} />
            ))}
          </div>
          {remaining.length > 0 ? (
            <div
              role="group"
              aria-label={t("inbox.stackHint")}
              className="relative mt-2 touch-pan-y"
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={() => { touchStartY.current = null }}
              style={{ height: `${60 + Math.max(0, remaining.length - 1) * 12}px` }}
            >
              {remaining.map((ticket, index) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  user={user}
                  href={index === 0}
                  className={`absolute inset-x-0 top-0 transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none ${
                    index === 0 && isPeelingTop ? "-translate-y-[120%] opacity-0" : ""
                  }`}
                  style={{ top: index * 12, zIndex: remaining.length - index }}
                />
              ))}
            </div>
          ) : stackActive ? (
            <p className="py-6 text-center text-xs text-text3">{t("inbox.stackDone")}</p>
          ) : null}
        </>
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
  const [permission, setPermission] = useState("all")
  const searchInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function load() {
      try {
        setTickets(getTickets(locale))
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
  const statusOptions: [string, string][] = [
    ["todo", t(statuses.todo)],
    ["in-progress", t(statuses["in-progress"])],
    ["completed", t(statuses.completed)],
  ]
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
    && (permission === "all" || ticket.permissionIds.includes(permission as keyof typeof permissions))
    && `${ticket.title} ${ticket.description ?? ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  )
  const hasActiveFilters = Boolean(query) || status !== "all" || subject !== "all" || owner !== "all" || permission !== "all"

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

    return (
      <DropdownMenu key={label}>
        <DropdownMenuTrigger
          className={`flex h-9 shrink-0 items-center gap-1.5 rounded-2xl border px-2.5 text-sm transition-colors ${
            value !== "all"
              ? "border-transparent bg-[var(--project-filter-bg)] text-[var(--project-filter-fg)]"
              : "border-[var(--task-workspace-border)] bg-background text-[var(--task-workspace-muted)]"
          } ${mobile ? "" : "h-8 rounded-full px-3 text-xs"}`}
        >
          <RemixIcon name={icon} className="text-base" />
          <span className="whitespace-nowrap">{triggerLabel}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="!w-72 max-w-[calc(100vw-1.5rem)]">
          <DropdownMenuRadioGroup value={value} onValueChange={setValue}>
            <DropdownMenuRadioItem value="all" className="whitespace-nowrap">{t(allLabel)}</DropdownMenuRadioItem>
            {options.map(([id, name]) => (
              <DropdownMenuRadioItem value={id} key={id} className="whitespace-nowrap">{name}</DropdownMenuRadioItem>
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
    setPermission("all")
  }

  return (
    <>
      <section className="hidden min-w-0 flex-1 flex-col gap-4 p-4 lg:flex">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-medium">{t("miniBar.inbox")} <span className="text-sm text-text3">{filtered.length}</span></h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-8 items-center gap-2 rounded-full border border-border px-3">
            <RemixIcon name="search-line" />
            <input aria-label={t("inbox.search")} placeholder={t("inbox.search")} value={query} onChange={(event) => setQuery(event.target.value)} className="w-40 bg-transparent text-xs outline-none" />
          </label>
          {filter("ticket.status", "inbox.allStatuses", status, setStatus, statusOptions, "filter-3-line")}
          {filter("ticket.subject", "inbox.allSubjects", subject, setSubject, subjectOptions, "file-list-3-line")}
          {filter("inbox.user", "inbox.allUsers", owner, setOwner, owners, "group-line")}
          {filter("ticket.permissions", "inbox.allPermissions", permission, setPermission, permissionOptions, "checkbox-blank-circle-line")}
          {hasActiveFilters && <button type="button" className="h-8 px-2 text-xs text-text2" onClick={clearFilters}>{t("inbox.reset")}</button>}
        </div>
        {error && <p role="alert" className="text-error">{t("ticket.error")}</p>}
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {filtered.map((ticket) => (
            <Link key={ticket.id} href={`/inbox/${encodeURIComponent(ticket.id)}`} className="flex flex-wrap items-center gap-3 p-3 text-start hover:bg-bg2">
              <span className="min-w-40 flex-1 text-sm font-medium">{ticket.title || t("ticket.name")}</span>
              <span className="text-xs text-text3">{t(subjects[ticket.subject])}</span>
              <span className={`rounded-full px-2 py-1 text-xs ${ticket.status === "completed" ? "bg-success/10 text-success" : ticket.status === "in-progress" ? "bg-warning/10 text-warning" : "bg-brand/10 text-brand"}`}>{t(statuses[ticket.status])}</span>
                <span className="flex w-40 shrink-0 items-center gap-1.5 text-xs text-text2">
                  <AvatarGroup className="shrink-0 rtl:space-x-reverse">
                    <TicketAvatar src={ticketAvatar(ticket, user)} name={ticket.createdByName ?? user.name} size="size-6" />
                    {ticket.assigneeName && <TicketAvatar src={assignedAvatar(ticket)} name={ticket.assigneeName} size="size-6" />}
                  </AvatarGroup>
                  <span className="truncate">{ticket.createdByName ?? user.name}</span>
                </span>
              <span className="flex flex-wrap gap-1">{ticket.permissionIds.map((id) => <span key={id} className="rounded-md bg-bg2 px-2 py-1 text-xs text-text2">{t(permissions[id])}</span>)}</span>
            </Link>
          ))}
          {!filtered.length && <p className="p-8 text-center text-sm text-text3">{t("inbox.empty")}</p>}
        </div>
      </section>

      <section className="flex h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] min-h-0 min-w-0 flex-none flex-col overflow-hidden bg-[var(--project-surface)] lg:hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--task-workspace-border)] bg-background px-4">
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

        <div className="shrink-0 px-4 pt-4">
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center justify-start gap-2">
              <Image
                src={user.avatarUrl ?? avatarByOwner.u1}
                alt={user.name}
                width={52}
                height={52}
                className="size-[52px] shrink-0 rounded-2xl object-cover"
              />
              <div className="min-w-0 text-right">
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
          {filter("inbox.user", "inbox.allUsers", owner, setOwner, owners, "group-line", true)}
          {filter("ticket.status", "inbox.allStatuses", status, setStatus, statusOptions, "filter-3-line", true)}
          {filter("ticket.subject", "inbox.allSubjects", subject, setSubject, subjectOptions, "file-list-3-line", true)}
          {filter("ticket.permissions", "inbox.allPermissions", permission, setPermission, permissionOptions, "checkbox-blank-circle-line", true)}
          {hasActiveFilters && <button type="button" className="h-9 shrink-0 rounded-2xl px-2 text-xs text-text2" onClick={clearFilters}>{t("inbox.reset")}</button>}
        </div>

        {error && <p role="alert" className="shrink-0 px-4 pt-2 text-xs text-error">{t("ticket.error")}</p>}
        <TicketCardStack key={filtered.map((ticket) => ticket.id).join(":")} tickets={filtered} user={user} t={t} />

        <Link
          href="/tickets/new"
          aria-label={t("ticket.create")}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] start-4 z-40 inline-flex h-9 items-center gap-2 rounded-full bg-[var(--project-brand)] py-2 pe-2 ps-4 text-[13px] font-semibold text-white"
        >
          <span>{t("projects.create")}</span>
          <RemixIcon name="add-circle-fill" className="text-xl" />
        </Link>
      </section>
    </>
  )
}
