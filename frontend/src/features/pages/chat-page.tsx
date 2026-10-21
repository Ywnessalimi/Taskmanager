"use client"

import { useEffect, useState } from "react"
import { useLocale } from "@/components/providers/locale-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RemixIcon } from "@/components/ui/remix-icon"
import { createProjectChatMessage, getProjectChatMessages, type ProjectChatMessage } from "@/lib/api/project-pages"

type Message = ProjectChatMessage

/** چت پروژه از API/SQLite می‌خواند و پیام‌ها را پایدار می‌کند؛ بدون projectId حالت مسیر عمومی محلی می‌ماند. */
export function ChatPage({ currentUserName, currentUserAvatarUrl = "/avatars/u1.jpg", projectId }: { currentUserName: string; currentUserAvatarUrl?: string; projectId?: string }) {
  const { locale } = useLocale()
  const en = locale === "en"
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(false)

  useEffect(() => {
    if (!projectId) return
    let active = true
    const refresh = () => getProjectChatMessages(projectId).then((next) => { if (active) setMessages(next) }).catch(() => undefined)
    void refresh()
    const interval = window.setInterval(refresh, 5000)
    return () => { active = false; window.clearInterval(interval) }
  }, [projectId])

  async function send() {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    try {
      if (projectId) {
        const saved = await createProjectChatMessage(projectId, { authorName: currentUserName, text })
        setMessages((previous) => previous.some((message) => message.id === saved.id) ? previous : [...previous, saved])
      } else {
        setMessages((previous) => [...previous, { id: `m-${Date.now()}`, projectId: "", authorName: currentUserName, text, createdAt: new Date().toISOString() }])
      }
      setDraft("")
      setSendError(false)
    } catch {
      setSendError(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 py-2">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="m-auto py-12 text-center text-sm text-text2">{en ? "No messages yet. Write the first message." : "هنوز پیامی نیست. اولین پیام را بنویسید."}</p>
        ) : messages.map((message) => (
          <div key={message.id} className="flex items-start gap-2.5">
            <Avatar size="sm"><AvatarImage src={message.authorName === currentUserName ? currentUserAvatarUrl : undefined} alt={message.authorName} /><AvatarFallback>{message.authorName.slice(0, 1)}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2"><span className="text-sm font-medium text-foreground">{message.authorName}</span><time className="text-xs text-text3">{new Intl.DateTimeFormat(en ? "en-US" : "fa-IR", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.createdAt))}</time></div>
              <p className="whitespace-pre-wrap break-words text-sm text-text2">{message.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-2 border-t border-border pt-2">
        <input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void send()} aria-label={en ? "Message" : "پیام"} placeholder={en ? "Write a message…" : "پیام بنویسید…"} className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground outline-none placeholder:text-text3" />
        <button type="button" onClick={() => void send()} disabled={!draft.trim() || sending} aria-label={en ? "Send message" : "ارسال پیام"} className="flex size-8 shrink-0 items-center justify-center rounded-md text-icon2 hover:bg-bg2 hover:text-icon disabled:opacity-40"><RemixIcon name="send-plane-line" className="text-base" /></button>
      </div>
      {sendError && <p role="alert" className="shrink-0 text-xs text-error">{en ? "Message could not be saved. Try again." : "پیام ذخیره نشد. دوباره تلاش کنید."}</p>}
    </div>
  )
}
