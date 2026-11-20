"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Eye, Menu, Plus, ShieldCheck, X } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useLocale } from "@/components/providers/locale-provider"
import { DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RemixIcon } from "@/components/ui/remix-icon"
import { sendAssistantMessage, type AssistantAccessMode, type AssistantAttachmentInput, type AssistantWidget } from "@/lib/api/assistant"
import { AssistantWidgetView } from "./assistant-widgets"
import { AssistantConnections } from "./assistant-connections"

export const AI_GRADIENT = "linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)"

type ChatMessage = { id: string; role: "user" | "assistant"; text: string; attachments?: string[]; historyContext?: string; widgets?: AssistantWidget[]; usedSkills?: string[] }
type ChatSession = { id: string; title: string; updatedAt: string; messages: ChatMessage[] }

const historyStorageKey = "quire-assistant-history-v1"
const maxHistoryCount = 10

function getWidgetContext(widgets: AssistantWidget[] = []) {
  return widgets.map(widget => {
    if (widget.type === "report") return `Report ID ${widget.report.id}, title ${widget.report.title}, summary ${JSON.stringify(widget.report.summary)}`
    if (widget.type === "preview") return `Pending preview ${widget.id}, items ${widget.items.map(item => item.title).join(", ")}`
    if (widget.type === "question") return widget.question
    return `File for report ${widget.reportId}`
  }).join("\n")
}

function titleFor(messages: ChatMessage[], fa: boolean) {
  const firstUserMessage = messages.find(message => message.role === "user")
  return firstUserMessage?.text.replace(/\s+/g, " ").trim().slice(0, 56) || (fa ? "گفتگوی جدید" : "New chat")
}

function HistoryList({ sessions, currentId, fa, horizontal = false, disabled, onSelect }: {
  sessions: ChatSession[]
  currentId: string | null
  fa: boolean
  horizontal?: boolean
  disabled?: boolean
  onSelect: (session: ChatSession) => void
}) {
  if (!sessions.length) return <p className="p-3 text-sm text-text2">{fa ? "هنوز گفتگویی ذخیره نشده است." : "No saved chats yet."}</p>
  return <div dir={horizontal ? "ltr" : fa ? "rtl" : "ltr"} className={horizontal ? "flex w-full gap-2 overflow-x-auto overscroll-x-contain pb-2" : "min-h-0 flex-1 space-y-1 overflow-y-auto p-2"} onWheel={horizontal ? event => {
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      event.preventDefault()
      event.currentTarget.scrollLeft += event.deltaY
    }
  } : undefined}>
    {sessions.map(session => <button key={session.id} type="button" disabled={disabled} aria-current={session.id === currentId ? "true" : undefined} dir={fa ? "rtl" : "ltr"} className={`rounded-lg border p-3 text-start disabled:opacity-50 ${horizontal ? "w-52 shrink-0" : "w-full"} ${session.id === currentId ? "border-foreground/40 bg-bg2" : "border-border hover:bg-bg2"}`} onClick={() => onSelect(session)}>
      <span className="line-clamp-2 block text-sm font-medium">{session.title}</span>
      <span className="mt-2 block text-xs text-text3">{new Intl.DateTimeFormat(fa ? "fa-IR" : "en-US", { month: "short", day: "numeric" }).format(new Date(session.updatedAt))}</span>
    </button>)}
  </div>
}

const acceptedFileTypes = ".xlsx,.docx,.csv,.txt,.md,.json"
const maxFileBytes = 2 * 1024 * 1024
const maxTotalFileBytes = 4 * 1024 * 1024
const maxFileCount = 3

async function encodeFile(file: File): Promise<AssistantAttachmentInput> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ""
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 0x8000, bytes.length)))
  }
  return { name: file.name, data: btoa(binary) }
}

export function AIAssistantDialog({ presentation = "modal" }: { presentation?: "modal" | "fullscreen" }) {
  const { locale, t } = useLocale()
  const fa = locale === "fa"
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [pending, setPending] = useState(false)
  const [connections, setConnections] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [accessMode, setAccessMode] = useState<AssistantAccessMode>("review")
  const [accessMenuOpen, setAccessMenuOpen] = useState(false)
  const [error, setError] = useState("")
  const requestLock = useRef(false)
  const listRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(historyStorageKey) ?? "[]")
      if (Array.isArray(stored)) {
        const valid = stored.filter((session): session is ChatSession => session && typeof session.id === "string" && typeof session.title === "string" && typeof session.updatedAt === "string" && Array.isArray(session.messages))
          .map(session => ({ ...session, messages: session.messages.filter((message: ChatMessage) => message && typeof message.id === "string" && ["user", "assistant"].includes(message.role) && typeof message.text === "string") }))
          .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
          .slice(0, maxHistoryCount)
        setSessions(valid)
      }
    } catch { /* Ignore malformed local history. */ }
    setHistoryLoaded(true)
  }, [])

  useEffect(() => {
    if (!historyLoaded || !currentChatId || !messages.length) return
    const session: ChatSession = {
      id: currentChatId,
      title: titleFor(messages, fa),
      updatedAt: new Date().toISOString(),
      messages: messages.slice(-40).map(({ id, role, text, attachments, historyContext }) => ({ id, role, text, attachments, historyContext })),
    }
    const next = [session, ...sessions.filter(item => item.id !== currentChatId)].slice(0, maxHistoryCount)
    setSessions(next)
    try { window.localStorage.setItem(historyStorageKey, JSON.stringify(next)) } catch { /* Keep the current chat usable if browser storage is full. */ }
    // sessions is intentionally read as the latest saved history for this chat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, currentChatId, historyLoaded, fa])

  function scrollToBottom() {
    requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }))
  }

  async function send(value = draft) {
    const text = value.trim()
    const queuedFiles = files
    if ((!text && !queuedFiles.length) || requestLock.current) return
    requestLock.current = true
    const chatId = currentChatId ?? crypto.randomUUID()
    setCurrentChatId(chatId)
    setHistoryOpen(false)
    const displayText = text || (fa ? "لطفاً فایل‌های پیوست‌شده را بررسی کن." : "Please review the attached files.")
    const nextMessages = [...messages, { id: crypto.randomUUID(), role: "user" as const, text: displayText, attachments: queuedFiles.map(file => file.name) }]
    setMessages(nextMessages)
    setDraft("")
    setFiles([])
    setError("")
    setPending(true)
    scrollToBottom()
    try {
      const history = nextMessages.slice(-20).map(message => {
        const references = message.historyContext || getWidgetContext(message.widgets)
        const attachmentReferences = message.attachments?.map(name => `Attached file: ${name}`).join("\n") ?? ""
        return { role: message.role, content: `${message.text}${attachmentReferences ? `\n${attachmentReferences}` : ""}${references ? `\n${references}` : ""}`.slice(0, 12000) || "…" }
      })
      const encodedFiles = await Promise.all(queuedFiles.map(encodeFile))
      const response = await sendAssistantMessage(history, locale, accessMode, encodedFiles)
      setMessages(previous => [...previous, { id: crypto.randomUUID(), role: "assistant", text: response.reply, historyContext: getWidgetContext(response.widgets), widgets: response.widgets, usedSkills: response.usedSkills }])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("aiAssistant.error"))
      setDraft(text)
      setFiles(queuedFiles)
    } finally {
      requestLock.current = false
      setPending(false)
      scrollToBottom()
    }
  }

  const suggestions = fa
    ? ["برای پروژه‌ام برنامهٔ کار و تسک بساز", "گزارش وضعیت پروژه و خروجی Excel می‌خواهم", "اعلان‌های خوانده‌نشده‌ام را خلاصه کن"]
    : ["Plan tasks for my project", "Show a project report and export to Excel", "Summarize my unread notifications"]

  function startNewChat() {
    if (pending) return
    setCurrentChatId(null)
    setMessages([])
    setDraft("")
    setFiles([])
    setError("")
    setConnections(false)
    setHistoryOpen(false)
  }

  function selectChat(session: ChatSession) {
    if (pending) return
    setCurrentChatId(session.id)
    setMessages(session.messages)
    setDraft("")
    setFiles([])
    setError("")
    setConnections(false)
    setHistoryOpen(false)
    scrollToBottom()
  }

  function openConnections() {
    setConnections(true)
    setHistoryOpen(false)
  }

  function addFiles(selected: FileList | null) {
    if (!selected?.length) return
    const incoming = Array.from(selected)
    const next = [...files]
    for (const file of incoming) {
      if (!acceptedFileTypes.split(",").some(extension => file.name.toLowerCase().endsWith(extension))) {
        setError(fa ? `قالب فایل «${file.name}» پشتیبانی نمی‌شود.` : `The file type for “${file.name}” is not supported.`)
        continue
      }
      if (file.size > maxFileBytes) {
        setError(fa ? `فایل «${file.name}» باید کوچک‌تر از ۲ مگابایت باشد.` : `“${file.name}” must be smaller than 2 MB.`)
        continue
      }
      const totalBytes = [...next, file].reduce((sum, item) => sum + item.size, 0)
      if (next.length >= maxFileCount || totalBytes > maxTotalFileBytes) {
        setError(fa ? "حداکثر ۳ فایل و در مجموع ۴ مگابایت می‌توانید پیوست کنید." : "Attach up to 3 files with a combined size of 4 MB.")
        continue
      }
      if (!next.some(item => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified)) next.push(file)
    }
    setFiles(next)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return <DialogContent variant="floatingPanel" showCloseButton={false} className={`gap-0 p-0 shadow-none ${presentation === "fullscreen" ? "sm:!inset-2 sm:!w-auto sm:!max-w-none sm:rounded-2xl" : "sm:max-w-[600px]"}`}>
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
      <div dir="ltr" className="flex items-center gap-2">
        <div dir={fa ? "rtl" : "ltr"} className="flex items-center gap-2">
          <Image src="/images/ai/assistant-icon.png" alt="" width={24} height={24} />
          <DialogTitle className="text-sm font-medium">{t("aiAssistant.title")}</DialogTitle>
        </div>
        <Button variant="ghost" size="icon" disabled={pending} aria-label={fa ? "تاریخچهٔ گفتگوها" : "Chat history"} aria-expanded={historyOpen} onClick={() => setHistoryOpen(open => !open)}>
          <Menu className="size-5" />
        </Button>
      </div>
      <div className="flex items-center gap-1">
        {connections && <Button variant="ghost" size="sm" onClick={() => setConnections(false)}>{fa ? "گفتگو" : "Chat"}</Button>}
        <Button variant="outline" size="sm" disabled={pending} onClick={startNewChat}><Plus className="me-1 size-4" />{fa ? "چت جدید" : "New chat"}</Button>
        <DialogClose aria-label={t("taskDetail.close")} className="flex size-8 items-center justify-center rounded-md hover:bg-bg2"><RemixIcon name="close-line" /></DialogClose>
      </div>
    </div>
    <div dir={fa ? "rtl" : "ltr"} className="flex min-h-0 flex-1">
      {presentation === "fullscreen" && historyOpen && <aside aria-label={fa ? "تاریخچهٔ گفتگوها" : "Chat history"} className="hidden w-72 shrink-0 flex-col border-e border-border sm:flex">
        <div className="border-b border-border p-3"><p className="font-medium">{fa ? "تاریخچهٔ گفتگوها" : "Chat history"}</p></div>
        <HistoryList sessions={sessions} currentId={currentChatId} fa={fa} disabled={pending} onSelect={selectChat} />
        <div className="border-t border-border p-3"><Button variant="ghost" size="sm" disabled={pending} onClick={openConnections}>{fa ? "اتصال ابزارها" : "Connections"}</Button></div>
      </aside>}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className={connections ? "min-h-0 flex-1 overflow-auto" : "hidden"}>{connections && <AssistantConnections />}</div>
    <div ref={listRef} className={`${connections ? "hidden" : "flex"} min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4`} aria-live="polite" aria-busy={pending}>
      {!messages.length && <div className="flex flex-1 flex-col justify-center gap-5 py-8">
        <div className="space-y-2"><Image src="/images/ai/assistant-icon.png" alt="" width={48} height={48} /><p className="text-lg font-semibold">{t("aiAssistant.greeting")}</p><p className="text-sm text-text2">{fa ? "پروژه را توضیح دهید، تسک‌ها را انتخاب کنید یا گزارشتان را بسازید." : "Describe a project, select proposed tasks, or build your report."}</p></div>
        <div className="space-y-2">{suggestions.map(suggestion => <button key={suggestion} disabled={pending} onClick={() => void send(suggestion)} className="block w-full rounded-lg border border-border p-3 text-start text-sm hover:bg-bg2 disabled:opacity-50">{suggestion}</button>)}</div>
      </div>}
      {messages.map(message => <div key={message.id} className={`flex flex-col gap-2 ${message.role === "user" ? "items-end" : "items-stretch"}`}>
        {!!message.attachments?.length && <div dir="ltr" className="flex max-w-[85%] flex-wrap justify-end gap-1">{message.attachments.map(name => <span key={name} dir="auto" className="rounded-md border border-border bg-bg2 px-2 py-1 text-xs">{name}</span>)}</div>}
        {message.text && <div dir="auto" className={`break-words rounded-xl px-3 py-2 text-sm ${message.role === "user" ? "max-w-[85%] bg-bg2" : "w-full"}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
            p: ({ children }) => <p className="my-1.5 whitespace-pre-wrap">{children}</p>,
            h1: ({ children }) => <p className="my-2 text-lg font-semibold">{children}</p>,
            h2: ({ children }) => <p className="my-2 font-semibold">{children}</p>,
            ul: ({ children }) => <ul className="my-2 list-disc ps-5">{children}</ul>,
            ol: ({ children }) => <ol className="my-2 list-decimal ps-5">{children}</ol>,
            table: ({ children }) => <div className="overflow-auto"><table className="w-full text-start">{children}</table></div>,
            th: ({ children }) => <th className="border border-border p-2 text-start">{children}</th>,
            td: ({ children }) => <td className="border border-border p-2">{children}</td>,
            a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{children}</a>,
          }}>{message.text}</ReactMarkdown>
        </div>}
        {message.widgets?.map((widget, index) => <AssistantWidgetView key={`${message.id}-${index}`} widget={widget} onAnswer={answer => { if (pending) setDraft(answer); else void send(answer) }} onResult={text => setMessages(previous => [...previous, { id: crypto.randomUUID(), role: "assistant", text }])} />)}
        {!!message.usedSkills?.length && <p className="text-xs text-text3">{fa ? `${message.usedSkills.length} ابزار اجرا شد` : `${message.usedSkills.length} tools used`}</p>}
      </div>)}
      {pending && <p role="status" className="animate-pulse text-sm text-text2">{fa ? "در حال بررسی اطلاعات و آماده‌کردن پاسخ…" : "Checking your workspace and preparing a response…"}</p>}
      {error && <p role="alert" className="rounded-lg border border-border p-3 text-sm text-destructive">{error}</p>}
    </div>
    {!connections && <div className="shrink-0 border-t border-border p-3">
      <div className="rounded-xl border border-border p-2">
        <textarea dir={fa ? "rtl" : "ltr"} aria-label={t("aiAssistant.placeholder")} value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send() } }} rows={2} maxLength={12000} placeholder={t("aiAssistant.placeholder")} className="max-h-40 min-h-14 w-full resize-y bg-transparent p-1 text-sm outline-none" />
        {!!files.length && <div className="mt-2 flex flex-wrap gap-1" dir="ltr">{files.map(file => <span key={`${file.name}-${file.lastModified}`} className="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-bg2 px-2 py-1 text-xs"><span dir="auto" className="max-w-52 truncate">{file.name}</span><button type="button" disabled={pending} aria-label={fa ? `حذف ${file.name}` : `Remove ${file.name}`} className="rounded p-0.5 hover:bg-background disabled:opacity-50" onClick={() => setFiles(current => current.filter(item => item !== file))}><X className="size-3.5" /></button></span>)}<p className="basis-full text-start text-xs text-text3" dir={fa ? "rtl" : "ltr"}>{fa ? "فایل برای تحلیل و پیشنهاد استفاده می‌شود؛ ویرایش مستقیم فایل پشتیبانی نمی‌شود." : "Files provide context for suggestions; direct editing of the file is not supported."}</p></div>}
        <div dir="ltr" className="mt-2 flex flex-row items-center gap-1 border-t border-border pt-2">
          <input ref={fileInputRef} type="file" accept={acceptedFileTypes} multiple className="sr-only" aria-label={fa ? "انتخاب فایل" : "Choose files"} onChange={event => addFiles(event.currentTarget.files)} />
          <Button variant="ghost" size="icon" disabled={pending || files.length >= maxFileCount} aria-label={fa ? "پیوست فایل" : "Attach file"} title={fa ? "پیوست فایل" : "Attach file"} onClick={() => fileInputRef.current?.click()}><Plus className="size-5" /></Button>
          <div className="relative">
            <Button variant="ghost" size="sm" disabled={pending} aria-label={fa ? "سطح دسترسی" : "Access level"} aria-expanded={accessMenuOpen} onClick={() => setAccessMenuOpen(open => !open)}>
              {accessMode === "review" ? <ShieldCheck className="me-1 size-4" /> : <Eye className="me-1 size-4" />}
              <span dir="auto">{accessMode === "review" ? (fa ? "تأیید تغییرات" : "Review changes") : (fa ? "فقط خواندن" : "Read only")}</span>
            </Button>
            {accessMenuOpen && <div dir="ltr" role="group" aria-label={fa ? "سطح دسترسی دستیار" : "Assistant access level"} className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-xl border border-border bg-background p-1">
              <button type="button" role="menuitemradio" aria-checked={accessMode === "review"} className="flex w-full items-start gap-2 rounded-lg p-2 text-start hover:bg-bg2" onClick={() => { setAccessMode("review"); setAccessMenuOpen(false) }}>
                <ShieldCheck className="mt-0.5 size-4 shrink-0" /><span dir={fa ? "rtl" : "ltr"} className="flex-1"><span className="block text-sm font-medium">{fa ? "تأیید تغییرات" : "Review changes"}</span><span className="mt-1 block text-xs text-text2">{fa ? "هر تغییر نیاز به پیش‌نمایش و تأیید شما دارد." : "Changes need your review and confirmation."}</span></span>
              </button>
              <button type="button" role="menuitemradio" aria-checked={accessMode === "read-only"} className="flex w-full items-start gap-2 rounded-lg p-2 text-start hover:bg-bg2" onClick={() => { setAccessMode("read-only"); setAccessMenuOpen(false) }}>
                <Eye className="mt-0.5 size-4 shrink-0" /><span dir={fa ? "rtl" : "ltr"} className="flex-1"><span className="block text-sm font-medium">{fa ? "فقط خواندن" : "Read only"}</span><span className="mt-1 block text-xs text-text2">{fa ? "خواندن و گزارش؛ بدون پیشنهاد تغییر." : "Read and report; no write proposals."}</span></span>
              </button>
            </div>}
          </div>
          <span className="flex-1" />
          <Button size="icon" disabled={(!draft.trim() && !files.length) || pending} aria-label={t("aiAssistant.send")} onClick={() => void send()}><RemixIcon name="arrow-up-line" /></Button>
        </div>
      </div>
      <p className="mt-2 text-xs text-text3">{fa ? "هوش مصنوعی ممکن است اشتباه کند؛ تغییرات مهم را دوباره بررسی کنید." : "AI can make mistakes. Double-check important actions."}</p>
    </div>}
      </div>
    </div>
    {historyOpen && presentation === "modal" && <div className="fixed inset-0 z-[70] hidden items-center justify-center bg-black/10 p-4 sm:flex">
      <button type="button" aria-label={fa ? "بستن تاریخچه" : "Close history"} className="absolute inset-0" onClick={() => setHistoryOpen(false)} />
      <section role="dialog" aria-modal="true" aria-label={fa ? "تاریخچهٔ گفتگوها" : "Chat history"} dir={fa ? "rtl" : "ltr"} className="relative w-full max-w-xl rounded-2xl border border-border bg-background p-3">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">{fa ? "تاریخچهٔ گفتگوها" : "Chat history"}</h2><button type="button" aria-label={fa ? "بستن" : "Close"} className="rounded-md p-1 hover:bg-bg2" onClick={() => setHistoryOpen(false)}><X className="size-4" /></button></div>
        <HistoryList sessions={sessions} currentId={currentChatId} fa={fa} horizontal disabled={pending} onSelect={selectChat} />
        <div className="mt-2 border-t border-border pt-2"><Button variant="ghost" size="sm" disabled={pending} onClick={openConnections}>{fa ? "اتصال ابزارها" : "Connections"}</Button></div>
      </section>
    </div>}
    {historyOpen && <div className="absolute inset-0 z-[70] sm:hidden">
      <button type="button" aria-label={fa ? "بستن تاریخچه" : "Close history"} className="absolute inset-0 bg-black/15" onClick={() => setHistoryOpen(false)} />
      <aside aria-label={fa ? "تاریخچهٔ گفتگوها" : "Chat history"} dir={fa ? "rtl" : "ltr"} className={`absolute bottom-0 top-0 flex w-[min(84vw,340px)] flex-col border-border bg-background ${fa ? "right-0 border-l" : "left-0 border-r"}`}>
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3"><h2 className="text-sm font-semibold">{fa ? "تاریخچهٔ گفتگوها" : "Chat history"}</h2><button type="button" aria-label={fa ? "بستن" : "Close"} className="rounded-md p-1 hover:bg-bg2" onClick={() => setHistoryOpen(false)}><X className="size-4" /></button></div>
        <HistoryList sessions={sessions} currentId={currentChatId} fa={fa} disabled={pending} onSelect={selectChat} />
        <div className="shrink-0 border-t border-border p-3"><Button variant="ghost" size="sm" disabled={pending} onClick={openConnections}>{fa ? "اتصال ابزارها" : "Connections"}</Button></div>
      </aside>
    </div>}
  </DialogContent>
}
