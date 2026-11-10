"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useLocale } from "@/components/providers/locale-provider"
import { DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RemixIcon } from "@/components/ui/remix-icon"
import { sendAssistantMessage, type AssistantWidget } from "@/lib/api/assistant"
import { AssistantWidgetView } from "./assistant-widgets"
import { AssistantConnections } from "./assistant-connections"

export const AI_GRADIENT = "linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)"

type ChatMessage = { id: string; role: "user" | "assistant"; text: string; widgets?: AssistantWidget[]; usedSkills?: string[] }

export function AIAssistantDialog() {
  const { locale, t } = useLocale()
  const fa = locale === "fa"
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const [pending, setPending] = useState(false)
  const [connections, setConnections] = useState(false)
  const [error, setError] = useState("")
  const requestLock = useRef(false)
  const listRef = useRef<HTMLDivElement>(null)

  function scrollToBottom() {
    requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }))
  }

  async function send(value = draft) {
    const text = value.trim()
    if (!text || requestLock.current) return
    requestLock.current = true
    const nextMessages = [...messages, { id: crypto.randomUUID(), role: "user" as const, text }]
    setMessages(nextMessages)
    setDraft("")
    setError("")
    setPending(true)
    scrollToBottom()
    try {
      const history = nextMessages.slice(-20).map(message => {
        const references = (message.widgets ?? []).map(widget => {
          if (widget.type === "report") return `Report ID ${widget.report.id}, title ${widget.report.title}, summary ${JSON.stringify(widget.report.summary)}`
          if (widget.type === "preview") return `Pending preview ${widget.id}, items ${widget.items.map(item => item.title).join(", ")}`
          if (widget.type === "question") return widget.question
          return `File for report ${widget.reportId}`
        }).join("\n")
        return { role: message.role, content: `${message.text}${references ? `\n${references}` : ""}`.slice(0, 12000) || "…" }
      })
      const response = await sendAssistantMessage(history, locale)
      setMessages(previous => [...previous, { id: crypto.randomUUID(), role: "assistant", text: response.reply, widgets: response.widgets, usedSkills: response.usedSkills }])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("aiAssistant.error"))
      setDraft(text)
    } finally {
      requestLock.current = false
      setPending(false)
      scrollToBottom()
    }
  }

  const suggestions = fa
    ? ["برای پروژه‌ام برنامهٔ کار و تسک بساز", "گزارش وضعیت پروژه و خروجی Excel می‌خواهم", "اعلان‌های خوانده‌نشده‌ام را خلاصه کن"]
    : ["Plan tasks for my project", "Show a project report and export to Excel", "Summarize my unread notifications"]

  return <DialogContent variant="floatingPanel" showCloseButton={false} className="gap-0 p-0 shadow-none sm:max-w-[600px]">
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
      <div className="flex items-center gap-2">
        <Image src="/images/ai/assistant-icon.png" alt="" width={24} height={24} />
        <DialogTitle className="text-sm font-medium">{t("aiAssistant.title")}</DialogTitle>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => setConnections(!connections)}>{connections ? (fa ? "گفتگو" : "Chat") : (fa ? "اتصال ابزارها" : "Connections")}</Button>
        <DialogClose aria-label={t("taskDetail.close")} className="flex size-8 items-center justify-center rounded-md hover:bg-bg2"><RemixIcon name="close-line" /></DialogClose>
      </div>
    </div>
    <div className={connections ? "min-h-0 flex-1 overflow-auto" : "hidden"}>{connections && <AssistantConnections />}</div>
    <div ref={listRef} className={`${connections ? "hidden" : "flex"} min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4`} aria-live="polite" aria-busy={pending}>
      {!messages.length && <div className="flex flex-1 flex-col justify-center gap-5 py-8">
        <div className="space-y-2"><Image src="/images/ai/assistant-icon.png" alt="" width={48} height={48} /><p className="text-lg font-semibold">{t("aiAssistant.greeting")}</p><p className="text-sm text-text2">{fa ? "پروژه را توضیح دهید، تسک‌ها را انتخاب کنید یا گزارشتان را بسازید." : "Describe a project, select proposed tasks, or build your report."}</p></div>
        <div className="space-y-2">{suggestions.map(suggestion => <button key={suggestion} disabled={pending} onClick={() => void send(suggestion)} className="block w-full rounded-lg border border-border p-3 text-start text-sm hover:bg-bg2 disabled:opacity-50">{suggestion}</button>)}</div>
      </div>}
      {messages.map(message => <div key={message.id} className={`flex flex-col gap-2 ${message.role === "user" ? "items-end" : "items-stretch"}`}>
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
      <div className="flex items-end gap-2 rounded-xl border border-border p-2">
        <textarea aria-label={t("aiAssistant.placeholder")} value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send() } }} rows={2} maxLength={12000} placeholder={t("aiAssistant.placeholder")} className="max-h-40 min-w-0 flex-1 resize-none bg-transparent p-1 text-sm outline-none" />
        <Button size="icon" disabled={!draft.trim() || pending} aria-label={t("aiAssistant.send")} onClick={() => void send()}><RemixIcon name="arrow-up-line" /></Button>
      </div>
      <p className="mt-2 text-xs text-text3">{fa ? "تغییرات پس از انتخاب و تأیید شما ثبت می‌شوند." : "Changes are saved after your selection and confirmation."}</p>
    </div>}
  </DialogContent>
}
