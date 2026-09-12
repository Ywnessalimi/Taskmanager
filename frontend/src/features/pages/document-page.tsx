"use client"

import { useState } from "react"

/**
 * صفحه‌ی «سند»: یک صفحه‌ی خالی که کاربر می‌تواند در آن عنوان و متن بنویسد.
 * فعلاً ویرایشگر متن غنی (Rich Text) نیست و محتوا فقط در state مرورگر می‌ماند.
 */
export function DocumentPage({ title: initialTitle }: { title: string }) {
  const [title, setTitle] = useState(initialTitle)
  const [body, setBody] = useState("")

  return (
    <div className="flex flex-col gap-2 py-2">
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="عنوان سند"
        className="w-full bg-transparent text-base font-medium text-foreground outline-none placeholder:text-text3"
      />
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="اینجا بنویسید…"
        className="min-h-80 w-full resize-none bg-transparent text-sm leading-7 text-foreground outline-none placeholder:text-text3"
      />
      <p className="text-xs text-text3">
        {body.trim() ? `${body.trim().split(/\s+/).length} کلمه` : "هنوز چیزی نوشته نشده"}
      </p>
    </div>
  )
}
