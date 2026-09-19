"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useT } from "@/components/providers/locale-provider"
import { MOCK_TAGS } from "@/lib/api/mock-data"

/**
 * مودال تمام‌صفحه (موبایل) پیل برچسب — جایگزین اینپوت این‌لاین قبلی. یک جستجو روی برچسب‌های
 * ازقبل‌ساخته‌شده (`MOCK_TAGS` ∪ برچسب‌های خودِ تسک)، هر ردیف با کلیک toggle می‌شود، و اگر متن
 * تایپ‌شده دقیقاً برابر هیچ گزینه‌ای نباشد یک دکمه‌ی «ساخت «متن»» برچسب تازه می‌سازد و
 * بی‌درنگ انتخابش می‌کند. برچسب‌های تازه‌ساخته فقط در همین state محلی می‌مانند (بدون
 * پایداری، مثل بقیه‌ی اپ).
 */
export function TagPickerDialog({
  tags,
  onChange,
  trigger,
}: {
  tags: string[]
  onChange: (value: string[]) => void
  trigger: React.ReactNode
}) {
  const t = useT()
  const [query, setQuery] = useState("")
  const [createdTags, setCreatedTags] = useState<string[]>([])

  const allTags = Array.from(new Set([...MOCK_TAGS, ...createdTags, ...tags]))
  const trimmedQuery = query.trim()
  const filtered = trimmedQuery
    ? allTags.filter((tag) => tag.includes(trimmedQuery))
    : allTags
  const exactMatch = allTags.some((tag) => tag === trimmedQuery)

  function toggle(tag: string) {
    if (tags.includes(tag)) {
      onChange(tags.filter((t) => t !== tag))
    } else {
      onChange([...tags, tag])
    }
  }

  function createTag() {
    if (!trimmedQuery || exactMatch) return
    setCreatedTags((prev) => [...prev, trimmedQuery])
    onChange([...tags, trimmedQuery])
    setQuery("")
  }

  return (
    <Dialog onOpenChange={(open) => !open && setQuery("")}>
      {trigger}
      <DialogContent variant="fullscreen" onClick={(event) => event.stopPropagation()}>
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle>{t("tagPicker.title")}</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col p-2">
          <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5">
            <RemixIcon name="search-line" className="text-base text-icon2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("tagPicker.searchPlaceholder")}
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-text3"
            />
          </div>

          {!exactMatch && trimmedQuery && (
            <button
              type="button"
              onClick={createTag}
              className="mt-2 flex items-center gap-1.5 rounded-md p-2 text-start text-sm text-brand hover:bg-bg2"
            >
              <RemixIcon name="add-line" className="text-base" />
              {t("tagPicker.createPrefix")} «{trimmedQuery}»
            </button>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-text2">{t("tagPicker.noResults")}</p>
            ) : (
              filtered.map((tag) => {
                const checked = tags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggle(tag)}
                    className="flex w-full items-center gap-2 rounded-md p-2 text-start text-sm text-foreground hover:bg-bg2"
                  >
                    <RemixIcon name="price-tag-3-line" className="shrink-0 text-base text-icon2" />
                    <span className="min-w-0 flex-1 truncate">{tag}</span>
                    {checked && <RemixIcon name="check-line" className="shrink-0 text-base text-brand" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
