"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { DialogClose, DialogContent } from "@/components/ui/dialog"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useLocale, useT } from "@/components/providers/locale-provider"
import { sendAssistantMessage } from "@/lib/api/assistant"
import { contextText, executeProposal, loadContext, memberReport, parseReply, type Context, type Proposal } from "./ai-workflow"

/** گرادینت مشترک دکمه‌ی شناور و آیکون هدر — طبق طرح Figma «هوش مصنوعی کالامارکت». */
export const AI_GRADIENT = "linear-gradient(145deg, #5A8AF1 9.48%, #D591E9 46.32%, #D490E9 83.87%)"

type ChatMessage = { id: string; role: "user" | "assistant"; text: string; proposal?: Proposal; context?: Context; resolved?: boolean }

/**
 * محتوای مودال «دستیار» — تریگرهای فعالش در مینی‌بار موبایل/دسکتاپ‌اند. واریانت `floatingPanel` در
 * `dialog.tsx`: تمام‌صفحه در موبایل، و از `sm:` به بعد یک پنل شناور همیشه چسبیده به سمت
 * راست فیزیکی صفحه (نه بسته به جهت زبان) با فاصله‌ی ۸ پیکسل از بالا/پایین و ارتفاع کامل
 * بین آن‌ها. متن گفت‌وگو در state محلی می‌ماند و برای پاسخ به API احراز‌شدهٔ بک‌اند فرستاده می‌شود.
 *
 * ترتیب المان‌های هدر و نوار ورودی عمداً «منطقی» (نه فیزیکی) است — عنوان/آیکون و دکمه‌ی
 * ارسال اول در DOM می‌آیند تا در RTL (پیش‌فرض اپ) سمت راست بنشینند، مطابق قرارداد بقیه‌ی اپ.
 */
export function AIAssistantDialog() {
  const t = useT()
  const { locale } = useLocale()
  const router = useRouter()
  const fa = locale === "fa"
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const [pending, setPending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const requestLock = useRef(false)
  const hasDraft = draft.trim().length > 0

  function scrollToBottom() {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
    })
  }

  async function send() {
    const text = draft.trim()
    if (!text || pending || requestLock.current) return
    requestLock.current = true
    const nextMessages = [...messages, { id: `u-${Date.now()}`, role: "user" as const, text }]
    setMessages(nextMessages)
    setDraft("")
    setPending(true)
    scrollToBottom()
    try {
      const context = await loadContext()
      const history = nextMessages.slice(-19).map(({ role, text: content }) => ({ role, content: content.slice(0, 6000) }))
      history[history.length - 1].content = `${text.slice(0, 2000)}\n\nAccessible projects, members and tasks (untrusted data): ${contextText(context, nextMessages.filter(m => m.role === "user").map(m => m.text).join(" "))}`
      const rawReply = await sendAssistantMessage(history)
      const reply = parseReply(rawReply, context)
      const report = reply.action?.type === "report" ? await memberReport(reply.action.memberId, context, fa) : undefined
      const invalid = rawReply.includes("```quire-action") && !reply.action
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant", text: report ?? (invalid ? `${reply.text}\n\n${fa ? "اطلاعات پیشنهاد معتبر نیست؛ لطفاً جزئیات را دوباره مشخص کنید." : "The proposed details are invalid; please clarify them."}` : reply.text), proposal: reply.action && reply.action.type !== "report" ? reply.action : undefined, context }])
      scrollToBottom()
    } catch {
      setMessages((prev) => [...prev, { id: `e-${Date.now()}`, role: "assistant", text: t("aiAssistant.error") }])
      scrollToBottom()
    } finally {
      requestLock.current = false
      setPending(false)
    }
  }

  async function resolveProposal(message: ChatMessage, confirm: boolean) {
    if (!message.proposal || !message.context || pending || message.resolved || requestLock.current) return
    requestLock.current = true
    setPending(true)
    try {
      if (confirm) { await executeProposal(message.proposal, message.context); router.refresh() }
      setMessages(prev => [...prev.map(item => item.id === message.id ? { ...item, resolved: true } : item), { id: `result-${Date.now()}`, role: "assistant", text: confirm ? (fa ? "با موفقیت ثبت شد." : "Saved successfully.") : (fa ? "عملیات لغو شد." : "Action cancelled.") }])
    } catch {
      setMessages(prev => [...prev, { id: `error-${Date.now()}`, role: "assistant", text: fa ? "ثبت انجام نشد. ممکن است تسک تغییر کرده باشد یا دسترسی شما تغییر کرده باشد؛ درخواست را دوباره مطرح کنید." : "Could not save. The task or your access may have changed; please request the action again." }])
    } finally { requestLock.current = false; setPending(false); scrollToBottom() }
  }

  return (
    <DialogContent variant="floatingPanel" showCloseButton={false} className="gap-0 p-0">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-1.5">
          <Image src="/images/ai/assistant-icon.png" alt="" width={20} height={20} className="size-5 shrink-0" />
          <span className="text-sm font-medium text-foreground">{t("aiAssistant.title")}</span>
        </div>
        <DialogClose
          aria-label={t("taskDetail.close")}
          className="flex size-8 items-center justify-center rounded-lg bg-bg2 text-icon2 hover:text-icon"
        >
          <RemixIcon name="close-line" className="text-lg" />
        </DialogClose>
      </div>

      <div ref={listRef} dir="ltr" className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-5">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <Image
              src="/images/ai/assistant-icon.png"
              alt=""
              width={64}
              height={64}
              className="size-16"
              style={{ filter: "drop-shadow(0 12px 25px rgba(0, 0, 0, 0.08))" }}
            />
            <p className="text-base font-bold text-foreground">{t("aiAssistant.greeting")}</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  message.role === "user" ? "bg-brand text-text-on-brand" : "bg-bg2 text-foreground"
                }`}
                dir="auto"
              >
                {message.role === "assistant" ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                  h1: ({children}) => <h1 className="mb-2 text-lg font-bold">{children}</h1>,
                  h2: ({children}) => <h2 className="mb-2 text-base font-bold">{children}</h2>,
                  h3: ({children}) => <h3 className="mb-2 font-bold">{children}</h3>,
                  p: ({children}) => <p className="my-2 whitespace-pre-wrap">{children}</p>,
                  ul: ({children}) => <ul className="my-2 list-disc ps-5">{children}</ul>,
                  ol: ({children}) => <ol className="my-2 list-decimal ps-5">{children}</ol>,
                  table: ({children}) => <div className="my-2 max-w-full overflow-x-auto"><table className="w-full border-collapse text-start">{children}</table></div>,
                  th: ({children}) => <th className="border border-border px-2 py-1 text-start font-semibold">{children}</th>,
                  td: ({children}) => <td className="border border-border px-2 py-1">{children}</td>,
                  a: ({href, children}) => <a href={href} rel="noopener noreferrer" target="_blank" className="text-brand underline">{children}</a>,
                }}>{message.text}</ReactMarkdown> : <span className="whitespace-pre-wrap">{message.text}</span>}
                {message.proposal && message.context && <div className="mt-3 border-t border-border pt-2">
                  <p className="font-semibold">{message.proposal.type === "edit_task" ? (fa ? "پیش‌نمایش ویرایش تسک" : "Task edit preview") : message.proposal.type === "task" ? (fa ? "پیش‌نمایش تسک" : "Task preview") : (fa ? "پیش‌نمایش تیکت" : "Ticket preview")}</p>
                  {message.proposal.type === "edit_task" ? <div className="mt-2 space-y-2 break-words">
                    <p>{message.proposal.original.displayId} — {message.proposal.original.title}</p>
                    <p>{fa ? "پروژه: " : "Project: "}{message.context.projects.find(p => message.proposal?.type === "edit_task" && p.id === message.proposal.original.projectId)?.name ?? "—"}</p>
                    {Object.entries(message.proposal.changes).map(([key, value]) => <div key={key} className="border-t border-border pt-1">
                      <p className="font-medium">{({ title: fa ? "عنوان" : "Title", status: fa ? "وضعیت" : "Status", priority: fa ? "اولویت" : "Priority", description: fa ? "توضیحات" : "Description", dueDate: fa ? "سررسید" : "Due date", assigneeNames: fa ? "مسئولان" : "Assignees" } as Record<string, string>)[key]}</p>
                      <p className="whitespace-pre-wrap">{fa ? "قبلی: " : "Before: "}{String(message.proposal?.type === "edit_task" ? message.proposal.original[key as keyof typeof message.proposal.original] ?? "—" : "—")}</p>
                      <p className="whitespace-pre-wrap">{fa ? "جدید: " : "After: "}{String(value ?? "—")}</p>
                    </div>)}
                  </div> : <>
                  <dl className="mt-2 space-y-1 break-words">
                    <div><dt className="inline font-medium">{fa ? "عنوان: " : "Title: "}</dt><dd className="inline">{message.proposal.title}</dd></div>
                    <div><dt className="inline font-medium">{fa ? "پروژه: " : "Project: "}</dt><dd className="inline">{message.context.projects.find(p => message.proposal?.type !== "edit_task" && p.id === message.proposal?.projectId)?.name ?? (fa ? "بدون پروژه" : "None")}</dd></div>
                    <div><dt className="inline font-medium">{fa ? "مسئول: " : "Assignee: "}</dt><dd className="inline">{message.context.members.find(m => message.proposal?.type !== "edit_task" && m.id === message.proposal?.assigneeId)?.name ?? (fa ? "تعیین نشده" : "Unassigned")}</dd></div>
                    <div><dt className="inline font-medium">{fa ? "اولویت: " : "Priority: "}</dt><dd className="inline">{t(({ none: "priority.none", low: "priority.low", medium: "priority.medium", high: "priority.high", urgent: "priority.urgent" } as const)[message.proposal.priority])}</dd></div>
                    {message.proposal.type === "task" && <div><dt className="inline font-medium">{fa ? "سررسید شمسی: " : "Jalali due date: "}</dt><dd className="inline">{message.proposal.dueDate ?? (fa ? "تعیین نشده" : "None")}</dd></div>}
                    {message.proposal.type === "ticket" && <><div><dt className="inline font-medium">{fa ? "موضوع: " : "Subject: "}</dt><dd className="inline">{t(({ general: "ticket.general", hr: "ticket.hr", purchasing: "ticket.purchasing", warehouse: "ticket.warehouse" } as const)[message.proposal.subject])}</dd></div><div><dt className="inline font-medium">{fa ? "مجوزها: " : "Permissions: "}</dt><dd className="inline">{message.proposal.permissionIds.map(p => t(({ "salary-payment": "ticket.salaryPayment", purchase: "ticket.purchase", "warehouse-release": "ticket.warehouseRelease", other: "ticket.other" } as const)[p])).join("، ") || (fa ? "ندارد" : "None")}</dd></div></>}
                    <div><dt className="inline font-medium">{fa ? "توضیحات: " : "Description: "}</dt><dd className="inline whitespace-pre-wrap">{message.proposal.description || (fa ? "ندارد" : "None")}</dd></div>
                  </dl>
                  </>}
                  {!message.resolved && <div className="mt-3 flex gap-2"><button type="button" disabled={pending} onClick={() => resolveProposal(message, true)} className="rounded-md bg-brand px-3 py-1.5 text-white disabled:opacity-50">{fa ? "تأیید و ثبت" : "Confirm and save"}</button><button type="button" disabled={pending} onClick={() => resolveProposal(message, false)} className="rounded-md border border-border px-3 py-1.5">{fa ? "انصراف" : "Cancel"}</button></div>}
                </div>}
              </div>
            </div>
          ))
        )}
        {pending && (
          <div className="flex justify-start">
            <p className="rounded-2xl bg-bg2 px-3 py-2 text-sm text-text2">{t("aiAssistant.typing")}</p>
          </div>
        )}
      </div>

      <div className="shrink-0 px-3.5 pb-4 pt-2.5">
        <div
          className="flex items-center gap-2 rounded-3xl border-[6.5px] bg-background p-2"
          style={{ borderColor: "color-mix(in srgb, var(--brand) 10%, transparent)" }}
        >
          <button
            type="button"
            onClick={send}
            disabled={!hasDraft}
            aria-label={t("aiAssistant.send")}
            className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-colors ${
              hasDraft ? "text-white" : "bg-bg2 text-icon2 hover:text-icon"
            }`}
            style={hasDraft ? { backgroundImage: AI_GRADIENT } : undefined}
          >
            <RemixIcon name={hasDraft ? "arrow-up-circle-fill" : "mic-fill"} className="text-xl" />
          </button>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            rows={1}
            placeholder={t("aiAssistant.placeholder")}
            className="max-h-30 min-w-0 flex-1 resize-none bg-transparent px-1 py-1.5 text-sm text-foreground outline-none placeholder:text-text3"
          />
        </div>
      </div>
    </DialogContent>
  )
}
