"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { useLocale, useT } from "@/components/providers/locale-provider"
import { useTaskPanel } from "@/components/providers/task-panel-provider"
import { RemixIcon } from "@/components/ui/remix-icon"
import { backendRequest } from "@/lib/api/backend-client"
import { listTickets } from "@/lib/api/ticket-comments"
import type { Task, TaskFormProjectOption } from "@/lib/api/types"
import { projectPath } from "@/lib/organization-paths"

type TicketSearchItem = Awaited<ReturnType<typeof listTickets>>[number]

export function HeaderSearch({ projects }: { projects: TaskFormProjectOption[] }) {
  const t = useT()
  const { locale } = useLocale()
  const router = useRouter()
  const taskPanel = useTaskPanel()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [tasks, setTasks] = useState<Task[]>([])
  const [tickets, setTickets] = useState<TicketSearchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function closeSearch() {
    setOpen(false)
    setQuery("")
  }

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    let active = true
    Promise.all([backendRequest<Task[]>("/tasks"), listTickets()])
      .then(([nextTasks, nextTickets]) => {
        if (!active) return
        setTasks(nextTasks)
        setTickets(nextTickets)
      })
      .catch(() => {
        if (active) setLoadFailed(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) closeSearch()
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [open])

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale)
    if (!normalized) return []
    const projectNames = new Map(projects.map((project) => [project.id, project.name]))
    return [
      ...tasks
        .filter((task) => `${task.title} ${task.displayId}`.toLocaleLowerCase(locale).includes(normalized))
        .map((task) => ({
          id: `task-${task.id}`,
          kind: "task" as const,
          title: task.title,
          detail: task.projectId ? projectNames.get(task.projectId) : undefined,
          task,
        })),
      ...projects
        .filter((project) => `${project.name} ${project.organizationName}`.toLocaleLowerCase(locale).includes(normalized))
        .map((project) => ({ id: `project-${project.id}`, kind: "project" as const, title: project.name, detail: project.organizationName, projectId: project.id })),
      ...tickets
        .filter((ticket) => `${ticket.title} ${ticket.description ?? ""}`.toLocaleLowerCase(locale).includes(normalized))
        .map((ticket) => ({ id: `ticket-${ticket.id}`, kind: "ticket" as const, title: ticket.title, detail: ticket.description, ticketId: ticket.id })),
    ].slice(0, 8)
  }, [locale, projects, query, tasks, tickets])

  function openResult(result: (typeof results)[number]) {
    closeSearch()
    if (result.kind === "project") {
      const project = projects.find((entry) => entry.id === result.projectId)
      router.push(project ? projectPath(project) : `/home/projects/${result.projectId}`)
    } else if (result.kind === "ticket") {
      router.push(`/inbox/${encodeURIComponent(result.ticketId)}`)
    } else {
      taskPanel?.openTaskDetail(result.task)
      const project = projects.find((entry) => entry.id === result.task.projectId)
      router.push(result.task.projectId ? project ? projectPath(project) : `/home/projects/${result.task.projectId}` : "/home/projects/MyTasks")
    }
  }

  return (
    <div ref={rootRef} className="relative flex shrink-0 items-center">
      {open ? (
        <div dir="ltr" className="flex h-9 w-[min(24rem,60vw)] items-center gap-1 rounded-lg bg-bg2 px-2 text-foreground">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Escape") closeSearch() }}
            dir={locale === "fa" ? "rtl" : "ltr"}
            aria-label={t("globalSearch.placeholder")}
            aria-controls="global-search-results"
            aria-expanded={Boolean(query.trim())}
            placeholder={t("globalSearch.placeholder")}
            className="min-w-0 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-text3"
          />
          <button type="button" onClick={closeSearch} aria-label={t("inbox.closeSearch")} className="grid size-7 shrink-0 place-items-center rounded-md text-text2 hover:bg-background">
            <RemixIcon name="close-line" className="text-lg" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => { setLoading(true); setLoadFailed(false); setOpen(true) }} aria-label={t("globalSearch.placeholder")} aria-expanded={false} className="flex size-8 items-center justify-center text-icon2">
          <Image src="/images/figma/project-header/search.svg" alt="" width={20} height={20} />
        </button>
      )}

      {open && query.trim() && (
        <div id="global-search-results" role="listbox" aria-label={t("globalSearch.placeholder")} className="absolute start-0 top-full z-50 mt-2 max-h-80 w-[min(24rem,60vw)] overflow-y-auto rounded-lg border border-border bg-background p-1 text-foreground">
          {loading ? (
            <p className="px-3 py-4 text-sm text-text2">{t("globalSearch.loading")}</p>
          ) : results.length ? results.map((result) => (
            <button key={result.id} type="button" role="option" onClick={() => openResult(result)} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-start hover:bg-bg2">
              <RemixIcon name={result.kind === "task" ? "task-line" : result.kind === "project" ? "folder-line" : "chat-smile-line"} className="shrink-0 text-base text-icon2" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{result.title}</span>
                <span className="block truncate text-xs text-text2">{result.detail || t(`globalSearch.${result.kind}` as "globalSearch.task")}</span>
              </span>
              <span className="shrink-0 text-[11px] text-text3">{t(`globalSearch.${result.kind}` as "globalSearch.task")}</span>
            </button>
          )) : (
            <p className="px-3 py-4 text-sm text-text2">{loadFailed ? t("globalSearch.unavailable") : t("globalSearch.noResults")}</p>
          )}
        </div>
      )}
    </div>
  )
}
