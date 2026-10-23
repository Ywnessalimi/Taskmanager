"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { FormEvent, UIEvent } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLocale } from "@/components/providers/locale-provider"
import { RemixIcon } from "@/components/ui/remix-icon"
import { createOrganizationComment, getOrganizationActivity } from "@/lib/api/organizations"
import type { OrganizationActivity } from "@/lib/api/types"

const PAGE_SIZE = 15
const statusLabelKeys = { todo: "status.todo", "in-progress": "status.inProgress", completed: "status.completed" } as const

export function OrganizationActivityFeed({ organizationId }: { organizationId: string }) {
  const { locale, t } = useLocale()
  const [activities, setActivities] = useState<OrganizationActivity[]>([])
  const [draft, setDraft] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [feedError, setFeedError] = useState("")
  const [commentError, setCommentError] = useState("")
  const loadingRef = useRef(false)
  const hasMoreRef = useRef(true)
  const cursorRef = useRef<number | undefined>(undefined)
  const generationRef = useRef(0)

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return
    loadingRef.current = true
    setIsLoading(true)
    setFeedError("")
    const generation = generationRef.current
    try {
      const nextPage = await getOrganizationActivity(organizationId, { limit: PAGE_SIZE, before: cursorRef.current })
      if (generation !== generationRef.current) return
      setActivities((current) => {
        const seen = new Set(current.map((activity) => activity.id))
        return [...current, ...nextPage.filter((activity) => !seen.has(activity.id))]
      })
      if (nextPage.length) cursorRef.current = nextPage[nextPage.length - 1].cursor
      hasMoreRef.current = nextPage.length === PAGE_SIZE
      setHasMore(hasMoreRef.current)
    } catch {
      if (generation === generationRef.current) setFeedError(t("org.activity.loadError"))
    } finally {
      if (generation === generationRef.current) {
        loadingRef.current = false
        setIsLoading(false)
      }
    }
  }, [organizationId, t])

  useEffect(() => {
    generationRef.current += 1
    loadingRef.current = false
    hasMoreRef.current = true
    cursorRef.current = undefined
    setActivities([])
    setHasMore(true)
    setFeedError("")
    void loadMore()
  }, [loadMore])

  async function sendComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || isSending) return
    setIsSending(true)
    setCommentError("")
    try {
      const comment = await createOrganizationComment(organizationId, text)
      setActivities((current) => [comment, ...current])
      setDraft("")
    } catch {
      setCommentError(t("org.activity.commentError"))
    } finally {
      setIsSending(false)
    }
  }

  function handleFeedScroll(event: UIEvent<HTMLDivElement>) {
    const element = event.currentTarget
    if (element.scrollHeight - element.scrollTop - element.clientHeight < 64) void loadMore()
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Tehran",
    }).format(new Date(value))
  }

  function renderActivity(activity: OrganizationActivity) {
    const taskTitle = activity.details.title
    const actor = (
      <Avatar size="sm" className="mt-0.5 size-6 shrink-0">
        {activity.actorAvatarUrl && <AvatarImage src={activity.actorAvatarUrl} alt={activity.actorName} />}
        <AvatarFallback>{activity.actorName.slice(0, 1)}</AvatarFallback>
      </Avatar>
    )
    const date = <time className="shrink-0 text-[10px] text-[var(--task-workspace-muted)]">{formatDate(activity.createdAt)}</time>

    if (activity.kind === "comment") {
      return (
        <article key={activity.id} className="rounded-xl border border-[var(--task-workspace-border)] bg-background px-3 py-2.5">
          <div className="mb-2 flex items-center gap-2">
            {actor}
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-[var(--task-workspace-text)]">{activity.actorName}</span>
            {date}
          </div>
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[var(--task-workspace-secondary)]">{activity.details.text}</p>
        </article>
      )
    }

    const action = activity.kind === "task_created"
      ? t("org.activity.taskCreated")
      : `${t("org.activity.taskStatusChanged")}${activity.details.to ? `: ${t(statusLabelKeys[activity.details.to])}` : ""}`
    return (
      <article key={activity.id} className="flex items-start gap-2.5 py-1 text-xs leading-5 text-[var(--task-workspace-muted)]">
        {actor}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="font-medium text-[var(--task-workspace-secondary)]">{activity.actorName}</span>
            <span>{action}</span>
            {date}
          </div>
          {taskTitle && <p className="mt-0.5 break-words text-[var(--task-workspace-text)]">{taskTitle}</p>}
        </div>
      </article>
    )
  }

  return (
    <>
      <div onScroll={handleFeedScroll} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        {activities.map(renderActivity)}
        {activities.length === 0 && !isLoading && !feedError && <p className="m-auto py-5 text-center text-xs text-[var(--task-workspace-muted)]">{t("org.noRecentActivity")}</p>}
        {isLoading && <p className="py-2 text-center text-xs text-[var(--task-workspace-muted)]">{t("org.activity.loading")}</p>}
        {feedError && <div role="status" className="flex flex-col items-center gap-2 py-2 text-center text-xs text-[var(--task-workspace-muted)]"><span>{feedError}</span><button type="button" onClick={() => void loadMore()} className="text-brand hover:underline">{t("org.activity.retry")}</button></div>}
        {!hasMore && activities.length > 0 && <p className="py-1 text-center text-[10px] text-[var(--task-workspace-muted)]">{t("org.activity.end")}</p>}
      </div>
      <form onSubmit={sendComment} className="shrink-0 border-t border-[var(--task-workspace-border)] bg-background p-3">
        {commentError && <p role="alert" className="mb-2 text-xs text-destructive">{commentError}</p>}
        <div className="flex items-end gap-2 rounded-2xl border border-[var(--task-workspace-border)] bg-background p-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }}
            dir={locale === "fa" ? "rtl" : "ltr"}
            rows={2}
            maxLength={10_000}
            placeholder={t("newTask.commentPlaceholder")}
            aria-label={t("newTask.commentPlaceholder")}
            className="min-h-10 min-w-0 flex-1 resize-y bg-transparent px-1 py-1 text-start text-sm leading-5 outline-none placeholder:text-[var(--task-workspace-muted)]"
          />
          <button type="submit" disabled={!draft.trim() || isSending} aria-label={t("newTask.sendComment")} title={t("newTask.sendComment")} className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
            <RemixIcon name={isSending ? "loader-4-line" : "arrow-up-line"} className={`text-base ${isSending ? "animate-spin" : ""}`} />
          </button>
        </div>
      </form>
    </>
  )
}
