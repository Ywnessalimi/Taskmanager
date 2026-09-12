"use client"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { RemixIcon } from "@/components/ui/remix-icon"

type Message = {
  id: string
  authorName: string
  text: string
  /** زمان نسبی آماده برای نمایش — زمان واقعی هنوز پیاده نشده */
  timeLabel: string
}

/**
 * صفحه‌ی «چت»: گفتگوی اعضا حول همین پروژه/صفحه.
 * پیام‌ها فقط در state مرورگر می‌مانند؛ نه ذخیره می‌شوند و نه به کاربر دیگری می‌رسند
 * (هنوز نه API چتی وجود دارد و نه اتصال بلادرنگ).
 */
export function ChatPage({ currentUserName }: { currentUserName: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState("")

  function send() {
    const text = draft.trim()
    if (!text) return
    setMessages((prev) => [
      ...prev,
      { id: `m-${Date.now()}`, authorName: currentUserName, text, timeLabel: "همین حالا" },
    ])
    setDraft("")
  }

  return (
    <div className="flex flex-col gap-3 py-2">
      <div className="flex min-h-60 flex-col gap-3">
        {messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-text2">
            هنوز پیامی نیست. اولین پیام را بنویسید.
          </p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex items-start gap-2.5">
              <Avatar size="sm">
                <AvatarFallback>{message.authorName.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-foreground">{message.authorName}</span>
                  <span className="text-xs text-text3">{message.timeLabel}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap text-text2">{message.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-border pt-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && send()}
          placeholder="پیام بنویسید…"
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-text3"
        />
        <button
          type="button"
          onClick={send}
          disabled={!draft.trim()}
          aria-label="ارسال پیام"
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-icon2 hover:bg-bg2 hover:text-icon disabled:opacity-40"
        >
          <RemixIcon name="send-plane-line" className="text-base" />
        </button>
      </div>
    </div>
  )
}
