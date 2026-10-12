"use client"

import { useRef, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLocale } from "@/components/providers/locale-provider"
import { AssigneePickerDialog } from "./assignee-picker-dialog"
import { NewTaskAsset } from "./new-task-assets"
import type { CurrentUser, TaskFormMemberOption } from "@/lib/api/types"

type DraftComment = { id: number; text: string; date: Date; files: string[]; reacted: boolean }

/** فعالیت‌های پیش‌نویس ساخت تسک؛ بدون رخداد یا پیام نمونه و بدون ذخیرهٔ سروری. */
export function NewTaskActivity({ user, members, following, onFollowingChange, inline = false }: {
  inline?: boolean
  user: CurrentUser
  members: TaskFormMemberOption[]
  following: boolean
  onFollowingChange: (value: boolean) => void
}) {
  const { locale, t } = useLocale()
  const [comments, setComments] = useState<DraftComment[]>([])
  const [draft, setDraft] = useState("")
  const [files, setFiles] = useState<string[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [mentions, setMentions] = useState<string[]>([])
  const textarea = useRef<HTMLTextAreaElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const filtered = comments.filter((comment) => comment.text.toLocaleLowerCase().includes(query.toLocaleLowerCase()))

  function send() {
    if (!draft.trim() && files.length === 0) return
    setComments((previous) => [...previous, { id: Date.now(), text: draft.trim(), date: new Date(), files, reacted: false }])
    setDraft("")
    setFiles([])
    setMentions([])
  }

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
      <div className="flex min-h-32 flex-1 flex-col justify-end gap-3 overflow-y-auto p-3">
        {filtered.length === 0 && <p className="py-5 text-center text-xs text-[var(--task-workspace-muted)]">{t("taskDetail.noActivity")}</p>}
        {filtered.map((comment) => (
          <article key={comment.id} className="rounded-lg border border-[var(--task-workspace-border)] bg-background px-4 pt-4 pb-2">
            <div className="mb-3 flex items-center gap-1">
              <Avatar className="size-5">{user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}<AvatarFallback>{user.name.slice(0, 1)}</AvatarFallback></Avatar>
              <span className="text-sm">{user.name}</span>
              <time className="ms-2 text-xs text-[var(--task-workspace-muted)]">{new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", { month: "2-digit", day: "2-digit", timeZone: "Asia/Tehran" }).format(comment.date)}</time>
            </div>
            <p className="mb-3 whitespace-pre-wrap break-words">{comment.text}</p>
            {comment.files.map((file) => <p key={file} className="mb-2 truncate text-xs text-text2">{file}</p>)}
            <div className="flex items-center justify-between border-t border-[var(--task-workspace-border)] pt-2">
              <button type="button" aria-label={t("newTask.react")} aria-pressed={comment.reacted} onClick={() => setComments((previous) => previous.map((item) => item.id === comment.id ? { ...item, reacted: !item.reacted } : item))}>{comment.reacted ? "👍" : <NewTaskAsset name="emoji-sticker-line" />}</button>
              <button type="button" className="text-xs" onClick={() => { setDraft(`@${user.name} `); textarea.current?.focus() }}>{t("newTask.feedback")}</button>
            </div>
          </article>
        ))}
      </div>
      <div className="shrink-0 border-t border-[var(--task-workspace-border)] p-3">
        <div className="rounded-2xl border border-[var(--task-workspace-border)] bg-background px-2 pt-3 pb-2">
          <textarea ref={textarea} rows={2} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={t("newTask.commentPlaceholder")} aria-label={t("newTask.commentPlaceholder")} className="w-full resize-none bg-transparent outline-none placeholder:text-[var(--task-workspace-muted)]" />
          {files.map((file) => <p key={file} className="truncate text-xs text-text2">{file}</p>)}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AssigneePickerDialog members={members} assigneeNames={mentions} onChange={(names) => { setMentions(names); setDraft(names.map((name) => `@${name}`).join(" ") + " ") }} trigger={<DialogTrigger aria-label={t("newTask.mention")}><NewTaskAsset name="user-add-line" /></DialogTrigger>} />
              <button type="button" aria-label={t("taskForm.attachFile")} onClick={() => fileInput.current?.click()}><NewTaskAsset name="attachment-line" /></button>
              <input ref={fileInput} type="file" multiple className="hidden" onChange={(event) => setFiles(Array.from(event.target.files ?? []).map((file) => file.name))} />
            </div>
            <button type="button" onClick={send} disabled={!draft.trim() && files.length === 0} aria-label={t("newTask.sendComment")} className="rounded-lg bg-[var(--task-workspace-soft)] px-2 py-1 disabled:opacity-40"><NewTaskAsset name="send-plane2-fill" className="rtl:scale-x-[-1]" /></button>
          </div>
        </div>
      </div>
    </aside>
  )
}
