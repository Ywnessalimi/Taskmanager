"use client"

import { useEffect, useState } from "react"

/**
 * صفحه‌ی «سند»: ویرایش عنوان و متن ساده؛ والد محتوا را با API پروژه ذخیره می‌کند.
 */
export function DocumentPage({ title: initialTitle, content: initialContent = "", onChange }: { title: string; content?: string; onChange?: (title: string, content: string) => void }) {
  const [title, setTitle] = useState(initialTitle)
  const [body, setBody] = useState(initialContent)

  useEffect(() => setTitle(initialTitle), [initialTitle])
  useEffect(() => setBody(initialContent), [initialContent])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 py-2">
      <input
        value={title}
        onChange={(event) => { setTitle(event.target.value); onChange?.(event.target.value, body) }}
        placeholder="عنوان سند"
        className="w-full bg-transparent text-base font-medium text-foreground outline-none placeholder:text-text3"
      />
      <textarea
        value={body}
        onChange={(event) => { setBody(event.target.value); onChange?.(title, event.target.value) }}
        placeholder="اینجا بنویسید…"
        className="min-h-0 w-full flex-1 resize-none bg-transparent text-sm leading-7 text-foreground outline-none placeholder:text-text3"
      />
      <p className="text-xs text-text3">
        {body.trim() ? `${body.trim().split(/\s+/).length} کلمه` : "هنوز چیزی نوشته نشده"}
      </p>
    </div>
  )
}
