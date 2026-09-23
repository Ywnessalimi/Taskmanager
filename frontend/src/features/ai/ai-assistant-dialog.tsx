"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { DialogClose, DialogContent } from "@/components/ui/dialog"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useT } from "@/components/providers/locale-provider"

/** گرادینت مشترک دکمه‌ی شناور و آیکون هدر — طبق طرح Figma «هوش مصنوعی کالامارکت». */
export const AI_GRADIENT = "linear-gradient(145deg, #5A8AF1 9.48%, #D591E9 46.32%, #D490E9 83.87%)"

type ChatMessage = { id: string; role: "user" | "assistant"; text: string }

/**
 * محتوای مودال «دستیار» — تریگرش `AIAssistantFab` است. واریانت `floatingPanel` در
 * `dialog.tsx`: تمام‌صفحه در موبایل، و از `sm:` به بعد یک پنل شناور همیشه چسبیده به سمت
 * راست فیزیکی صفحه (نه بسته به جهت زبان) با فاصله‌ی ۸ پیکسل از بالا/پایین و ارتفاع کامل
 * بین آن‌ها. چون هنوز هیچ سرویس هوش مصنوعی واقعی وصل نیست، فقط یک پاسخ ثابت
 * (`aiAssistant.mockReply`) بعد از هر پیام کاربر برمی‌گردد — مثل بقیه‌ی این فاز، صرفاً state
 * محلی همین کامپوننت است.
 *
 * ترتیب المان‌های هدر و نوار ورودی عمداً «منطقی» (نه فیزیکی) است — عنوان/آیکون و دکمه‌ی
 * ارسال اول در DOM می‌آیند تا در RTL (پیش‌فرض اپ) سمت راست بنشینند، مطابق قرارداد بقیه‌ی اپ.
 */
export function AIAssistantDialog() {
  const t = useT()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const [pending, setPending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const hasDraft = draft.trim().length > 0

  function scrollToBottom() {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
    })
  }

  function send() {
    const text = draft.trim()
    if (!text || pending) return
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text }])
    setDraft("")
    setPending(true)
    scrollToBottom()
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant", text: t("aiAssistant.mockReply") }])
      setPending(false)
      scrollToBottom()
    }, 700)
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

      <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-5">
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
              <p
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  message.role === "user" ? "bg-brand text-text-on-brand" : "bg-bg2 text-foreground"
                }`}
              >
                {message.text}
              </p>
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
