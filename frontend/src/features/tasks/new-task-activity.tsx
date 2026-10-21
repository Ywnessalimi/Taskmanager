"use client"

import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DialogTrigger } from "@/components/ui/dialog"
import { RemixIcon } from "@/components/ui/remix-icon"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLocale } from "@/components/providers/locale-provider"
import { AssigneePickerDialog } from "./assignee-picker-dialog"
import { NewTaskAsset } from "./new-task-assets"
import type { CurrentUser, TaskFormMemberOption, TicketActivity, TicketComment } from "@/lib/api/types"

type ActivityComment = { id: string | number; text: string; date: Date; files: string[]; reacted: boolean; reaction?: string; authorName: string; authorAvatarUrl?: string }
type CommentStore = {
  list: () => Promise<TicketComment[]>
  create: (text: string) => Promise<TicketComment>
}
type ActivityStore = { list: () => Promise<TicketActivity[]> }

/** بخش فعالیت ساخت تسک؛ در حالت inline تمام فضای باقی‌مانده را می‌گیرد و نوار ذخیره بیرون آن می‌ماند. */
export function NewTaskActivity({ user, members, following, onFollowingChange, inline = false, footerAction, commentStore, activityStore, canComment = true, emojiPicker = false }: {
  inline?: boolean
  footerAction?: ReactNode
  commentStore?: CommentStore
  activityStore?: ActivityStore
  canComment?: boolean
  emojiPicker?: boolean
  user: CurrentUser
  members: TaskFormMemberOption[]
  following: boolean
  onFollowingChange: (value: boolean) => void
}) {
  const { locale, t } = useLocale()
  const [comments, setComments] = useState<ActivityComment[]>([])
  const [events, setEvents] = useState<TicketActivity[]>([])
  const [draft, setDraft] = useState("")
  const [files, setFiles] = useState<string[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [mentions, setMentions] = useState<string[]>([])
  const [commentError, setCommentError] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(Boolean(commentStore))
  const [isSavingComment, setIsSavingComment] = useState(false)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const desktopTextarea = useRef<HTMLTextAreaElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const filtered = comments.filter((comment) => comment.text.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  const timeline = [
    ...events.filter(event => event.kind !== "comment").map(event => ({ type: "event" as const, id: event.id, date: new Date(event.createdAt), event })),
    ...filtered.map(comment => ({ type: "comment" as const, id: String(comment.id), date: comment.date, comment })),
  ].sort((left, right) => left.date.getTime() - right.date.getTime())

  useEffect(() => {
    if (!commentStore) {
      setIsLoadingComments(false)
      return
    }
    let current = true
    setIsLoadingComments(true)
    commentStore.list().then((savedComments) => {
      if (!current) return
      const loaded = savedComments.map((comment) => ({
        id: comment.id,
        text: comment.text,
        date: new Date(comment.createdAt),
        files: [],
        reacted: false,
        authorName: comment.authorName,
        authorAvatarUrl: comment.authorAvatarUrl,
      }))
      setComments((previous) => {
        const merged = new Map(previous.map((comment) => [comment.id, comment]))
        loaded.forEach((comment) => merged.set(comment.id, comment))
        return [...merged.values()].sort((left, right) => left.date.getTime() - right.date.getTime())
      })
      setCommentError(false)
    }).catch(() => {
      if (current) setCommentError(true)
    }).finally(() => {
      if (current) setIsLoadingComments(false)
    })
    return () => { current = false }
  }, [commentStore])

  useEffect(() => {
    if (!activityStore) return
    let current = true
    activityStore.list().then(value => { if (current) setEvents(value) }).catch(() => { if (current) setCommentError(true) })
    return () => { current = false }
  }, [activityStore])

  async function send() {
    if (!canComment || isSavingComment || (!draft.trim() && (commentStore || files.length === 0))) return
    if (commentStore) {
      setIsSavingComment(true)
      try {
        const saved = await commentStore.create(draft.trim())
        setComments((previous) => [...previous, { id: saved.id, text: saved.text, date: new Date(saved.createdAt), files: [], reacted: false, authorName: saved.authorName, authorAvatarUrl: saved.authorAvatarUrl }])
        if (activityStore) setEvents(await activityStore.list())
        setCommentError(false)
      } catch {
        setCommentError(true)
        setIsSavingComment(false)
        return
      }
      setIsSavingComment(false)
      setFiles([])
      setMentions([])
      setDraft("")
      return
    }
    setComments((previous) => [...previous, { id: Date.now(), text: draft.trim(), date: new Date(), files, reacted: false, authorName: user.name, authorAvatarUrl: user.avatarUrl }])
    setDraft("")
    setFiles([])
    setMentions([])
  }
  const sendDisabled = isSavingComment || !canComment || (!draft.trim() && Boolean(commentStore || files.length === 0))

  return (
    <aside aria-label={t("newTask.activities")} className={`flex min-h-0 flex-1 flex-col bg-[var(--task-workspace-bg)] ${inline ? "w-full" : "border-s border-[var(--task-workspace-border)] lg:w-[361px] lg:shrink-0"}`}>
      <div className={`${inline ? "hidden lg:flex" : "flex"} h-14 shrink-0 items-center justify-between border-b border-[var(--task-workspace-border)] bg-background px-4`}>
        <h2 className="text-base font-medium">{t("newTask.activities")}</h2>
        <div className="flex items-center gap-2">
          <button type="button" aria-label={t("nav.search")} aria-pressed={searchOpen} onClick={() => setSearchOpen(!searchOpen)}><NewTaskAsset name="search2-line" /></button>
          <button type="button" aria-label={t("newTask.follow")} aria-pressed={following} onClick={() => onFollowingChange(!following)} className={following ? "rounded bg-bg2" : ""}><NewTaskAsset name="notification4-line" /></button>
          <DropdownMenu>
            <DropdownMenuTrigger aria-label={t("newTask.filterActivity")}><NewTaskAsset name="filter3-fill" /></DropdownMenuTrigger>
            <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setQuery("")}>{t("newTask.allActivity")}</DropdownMenuItem><DropdownMenuItem onClick={() => setQuery("")}>{t("newTask.comments")}</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {searchOpen && <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} aria-label={t("nav.search")} placeholder={t("newTask.searchActivity")} className="m-3 rounded-lg border border-border bg-background p-2 outline-none" />}
      <div className="flex min-h-32 flex-1 flex-col gap-3 overflow-y-auto p-3">
        {timeline.length === 0 && <p className="m-auto py-5 text-center text-xs text-[var(--task-workspace-muted)]">{isLoadingComments ? t("ticket.commentsLoading") : t("taskDetail.noActivity")}</p>}
        {timeline.map((entry) => entry.type === "event" ? <article key={entry.id} className="flex items-start gap-2 text-xs text-[var(--task-workspace-muted)]"><Avatar className="size-5"><AvatarImage src={entry.event.actorAvatarUrl} alt={entry.event.actorName} /><AvatarFallback>{entry.event.actorName.slice(0, 1)}</AvatarFallback></Avatar><div><span className="text-text2">{entry.event.actorName}</span>{" "}{entry.event.kind === "created" ? t("ticket.activity.created") : entry.event.kind === "assigned" ? `${t("ticket.activity.assigned")}: ${String(entry.event.details.to ?? t("ticket.unassigned"))}` : entry.event.kind === "status_changed" ? `${t("ticket.activity.statusChanged")}: ${String(entry.event.details.to)}` : entry.event.kind === "following" ? t(entry.event.details.following ? "ticket.activity.followingOn" : "ticket.activity.followingOff") : entry.event.kind === "favorite" ? t(entry.event.details.favorite ? "ticket.activity.favoriteOn" : "ticket.activity.favoriteOff") : t("ticket.activity.updated")}<time className="ms-2">{new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tehran" }).format(entry.date)}</time></div></article> : (
          <article key={entry.id} className="rounded-lg border border-[var(--task-workspace-border)] bg-background px-4 pt-4 pb-2">
            <div className="mb-3 flex items-center gap-1">
              <Avatar className="size-5">{entry.comment.authorAvatarUrl && <AvatarImage src={entry.comment.authorAvatarUrl} alt={entry.comment.authorName} />}<AvatarFallback>{entry.comment.authorName.slice(0, 1)}</AvatarFallback></Avatar>
              <span className="text-sm">{entry.comment.authorName}</span>
              <time className="ms-2 text-xs text-[var(--task-workspace-muted)]">{new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tehran" }).format(entry.comment.date)}</time>
            </div>
            <p className="mb-3 whitespace-pre-wrap break-words">{entry.comment.text}</p>
            {entry.comment.files.map((file) => <p key={file} className="mb-2 truncate text-xs text-text2">{file}</p>)}
            <div className="flex items-center justify-between border-t border-[var(--task-workspace-border)] pt-2">
              {emojiPicker ? <DropdownMenu><DropdownMenuTrigger aria-label={t("newTask.react")} aria-pressed={entry.comment.reacted} className="grid size-7 place-items-center rounded-md hover:bg-[var(--task-workspace-soft)]">{entry.comment.reaction ?? (entry.comment.reacted ? "👍" : <NewTaskAsset name="emoji-sticker-line" />)}</DropdownMenuTrigger><DropdownMenuContent align="start" className="flex w-auto min-w-0 flex-row gap-1 rounded-xl p-1.5">{["👍", "❤️", "😂", "🎉", "👀", "🙏"].map((emoji) => <DropdownMenuItem key={emoji} onClick={() => setComments((previous) => previous.map((item) => item.id === entry.comment.id ? { ...item, reacted: true, reaction: emoji } : item))} className="grid size-9 place-items-center rounded-lg p-0 text-xl">{emoji}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu> : <button type="button" aria-label={t("newTask.react")} aria-pressed={entry.comment.reacted} onClick={() => setComments((previous) => previous.map((item) => item.id === entry.comment.id ? { ...item, reacted: !item.reacted } : item))}>{entry.comment.reacted ? "👍" : <NewTaskAsset name="emoji-sticker-line" />}</button>}
              <button type="button" className="text-xs" onClick={() => { setDraft(`@${user.name} `); (inline && window.matchMedia("(min-width: 1024px)").matches ? desktopTextarea.current : textarea.current)?.focus() }}>{t("newTask.feedback")}</button>
            </div>
          </article>
        ))}
      </div>
      <div className="shrink-0 border-t border-[var(--task-workspace-border)] p-3">
        {inline && footerAction && <div className="mb-3 flex justify-end lg:hidden">{footerAction}</div>}
        {commentError && <p role="alert" className="mb-2 text-xs text-error">{t("ticket.commentError")}</p>}
        {inline && <div dir="ltr" className="flex items-center gap-2 rounded-2xl border border-[var(--task-workspace-border)] bg-background p-3 lg:hidden">
          <button type="button" onClick={send} disabled={sendDisabled} aria-label={t("newTask.sendComment")} className="flex h-7 shrink-0 items-center rounded-lg bg-[var(--task-workspace-soft)] px-2 disabled:opacity-40"><RemixIcon name="arrow-up-line" className={`text-base ${draft.trim() && canComment ? "text-brand" : "text-[var(--task-workspace-muted)]"}`} /></button>
          <button type="button" aria-label={t("taskForm.attachFile")} onClick={() => fileInput.current?.click()} className="grid size-4 shrink-0 place-items-center"><NewTaskAsset name="attachment-line" /></button>
          <AssigneePickerDialog members={members} assigneeNames={mentions} onChange={(names) => { setMentions(names); setDraft(names.map((name) => `@${name}`).join(" ") + " ") }} trigger={<DialogTrigger aria-label={t("newTask.mention")} className="grid size-4 shrink-0 place-items-center"><NewTaskAsset name="user-add-line" /></DialogTrigger>} />
          <textarea ref={textarea} dir={locale === "fa" ? "rtl" : "ltr"} rows={1} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={t("newTask.commentPlaceholder")} aria-label={t("newTask.commentPlaceholder")} className="min-h-5 min-w-0 flex-1 resize-none bg-transparent text-start text-sm leading-5 outline-none placeholder:text-[var(--task-workspace-muted)]" />
        </div>}
        <div className={`${inline ? "hidden lg:block" : ""} rounded-2xl border border-[var(--task-workspace-border)] bg-background px-2 pt-3 pb-2`}>
          <textarea ref={inline ? desktopTextarea : textarea} dir={locale === "fa" ? "rtl" : "ltr"} rows={2} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={t("newTask.commentPlaceholder")} aria-label={t("newTask.commentPlaceholder")} className="w-full resize-none bg-transparent text-start outline-none placeholder:text-[var(--task-workspace-muted)]" />
          {files.map((file) => <p key={file} className="truncate text-xs text-text2">{file}</p>)}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AssigneePickerDialog members={members} assigneeNames={mentions} onChange={(names) => { setMentions(names); setDraft(names.map((name) => `@${name}`).join(" ") + " ") }} trigger={<DialogTrigger aria-label={t("newTask.mention")}><NewTaskAsset name="user-add-line" /></DialogTrigger>} />
              <button type="button" aria-label={t("taskForm.attachFile")} onClick={() => fileInput.current?.click()}><NewTaskAsset name="attachment-line" /></button>
            </div>
            <button type="button" onClick={send} disabled={sendDisabled} aria-label={t("newTask.sendComment")} className="rounded-lg bg-[var(--task-workspace-soft)] px-2 py-1 disabled:opacity-40"><RemixIcon name="arrow-up-line" className="text-base" /></button>
          </div>
        </div>
        <input ref={fileInput} type="file" multiple className="hidden" onChange={(event) => setFiles(Array.from(event.target.files ?? []).map((file) => file.name))} />
      </div>
    </aside>
  )
}
