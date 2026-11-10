"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ProjectMembersDialog } from "./project-members-dialog"
import { RemixIcon } from "@/components/ui/remix-icon"
import { t, type Locale } from "@/lib/i18n/dictionary"
import type { Project } from "@/lib/api/types"

/**
 * جای‌گزین عکس پروژه (بدون عکس واقعی) — عیناً هم‌راستا با `OrgLogo` (رجوع به
 * `components/layout/org-logo.tsx`)، اما کامپوننت جدا چون معنایی مستقل (کاور پروژه، نه
 * لوگوی سازمان) و اندازه‌ی ثابت دیگری (۷۲px، طبق طرح Figma) دارد.
 */
function ProjectCover({ name }: { name: string }) {
  return (
    <div className="flex size-[72px] shrink-0 items-center justify-center rounded-lg bg-bg3 text-2xl font-medium text-text2">
      {name.slice(0, 1)}
    </div>
  )
}

function fileKind(file: File): "PDF" | "XLS" | "DOC" | "PPT" | "FILE" {
  const extension = file.name.split(".").pop()?.toLowerCase()
  if (extension === "pdf" || file.type === "application/pdf") return "PDF"
  if (["xls", "xlsx", "xlsm"].includes(extension ?? "") || /spreadsheet|ms-excel/.test(file.type)) return "XLS"
  if (["doc", "docx"].includes(extension ?? "") || /wordprocessing|msword/.test(file.type)) return "DOC"
  if (["ppt", "pptx"].includes(extension ?? "") || /presentation|ms-powerpoint/.test(file.type)) return "PPT"
  return "FILE"
}

function fileSize(bytes: number, locale: Locale): string {
  const units = ["B", "KB", "MB", "GB"]
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", { maximumFractionDigits: unit === 0 ? 0 : 1 }).format(value)} ${units[unit]}`
}

/** کارت انتخاب محلی؛ تصویر با URL موقت مرورگر نمایش داده و هنگام خروج آزاد می‌شود. */
function AttachmentCard({ file, locale }: { file: File; locale: Locale }) {
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageFailed, setImageFailed] = useState(false)
  const isImage = file.type.startsWith("image/") || (!file.type && /\.(?:png|jpe?g|gif|webp|bmp|avif|svg)$/i.test(file.name))
  const showImage = isImage && !imageFailed

  useEffect(() => {
    if (!showImage || !imageRef.current) return
    const url = URL.createObjectURL(file)
    imageRef.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [file, showImage])

  return (
    <div title={file.name} className="flex h-[72px] w-[240px] max-w-full items-center gap-3 overflow-hidden rounded-lg border border-border bg-background p-2">
      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-bg2">
        {showImage ? (
          // A local object URL is created in the effect and released when this card unmounts.
          // eslint-disable-next-line @next/next/no-img-element
          <img ref={imageRef} alt="" onError={() => setImageFailed(true)} className="size-full object-cover" />
        ) : (
          <div aria-hidden="true" className="relative flex h-10 w-8 items-end justify-center rounded-[3px] border border-icon2 bg-background pb-1.5 text-[9px] font-bold leading-none text-text2">
            <span className="absolute end-0 top-0 size-2 border-b border-s border-icon2 bg-bg2" />
            {fileKind(file)}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span dir="auto" className="block truncate text-sm font-medium text-foreground">{file.name}</span>
        <span className="flex items-center gap-1 text-xs text-text2">
          <span dir="auto">{locale === "fa" ? "موقت" : "Temporary"}</span>
          <span aria-hidden="true">·</span>
          <span dir="ltr">{fileSize(file.size, locale)}</span>
        </span>
      </div>
    </div>
  )
}

function ProjectAttachments({ locale }: { locale: Locale }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<File[]>([])

  return (
    <>
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        className="flex w-fit items-center gap-1.5 rounded-md py-1.5 text-sm text-text2 hover:text-foreground"
      >
        <RemixIcon name="attachment-line" className="text-base" />
        {t(locale, "project.addAttachment")}
      </button>
      <input ref={fileInput} type="file" multiple className="hidden" onChange={(event) => {
        const selected = Array.from(event.currentTarget.files ?? [])
        setAttachments((previous) => {
          const byName = new Map(previous.map((file) => [file.name, file]))
          selected.forEach((file) => { if (!byName.has(file.name)) byName.set(file.name, file) })
          return [...byName.values()]
        })
        event.currentTarget.value = ""
      }} />
      {attachments.length > 0 && <div className="flex max-w-full flex-wrap gap-2">{attachments.map((file) => <AttachmentCard key={file.name} file={file} locale={locale} />)}</div>}
    </>
  )
}

/**
 * هدر بالای تب «نمای‌کلی» پروژه — از طرح Figma «AlignUI — Project Header» (node
 * 13731:5329) گرفته شده: کاور + نام پروژه، ردیف سازمان/اعضا/بازه‌ی زمانی، توضیحات، و
 * افزودن پیوست. جای‌گزین بلوک قبلی («بازه‌ی زمانی پروژه» + دکمه‌ی «افزودن پیوست») شد که
 * حالا داخل همین هدر ادغام شده‌اند. رجوع به README همین پوشه برای جزئیات کامل و تفاوت‌های
 * عمدی با فایل طرح.
 */
export function ProjectOverviewHeader({ project, locale }: { project: Project; locale: Locale }) {
  return (
    <div className="flex items-start gap-4">
      <ProjectCover name={project.name} />

      <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
        <div className="flex items-start justify-between gap-3">
          <h1 className="min-w-0 truncate text-xl font-medium text-foreground">{project.name}</h1>
          <Link href={`/home/projects/${project.id}/settings`} className="flex shrink-0 flex-col items-center gap-1 rounded-md px-2 py-1 text-xs text-text2 hover:bg-bg2">
            <RemixIcon name="settings-3-line" className="text-xl" />
            {t(locale, "project.settings")}
          </Link>
        </div>

        <div className="flex flex-col items-start gap-2 text-sm">
          <Link href={`/home/organizations/${project.organizationId}`} className="text-brand hover:underline">{project.organizationName}</Link>
          <span className="text-text2">{project.divisionName}</span>
          <span
            dir="ltr"
            aria-label={t(locale, "project.timeline")}
            className="flex items-center gap-1.5 text-text2"
          >
            <RemixIcon name="calendar-line" className="text-base" />
            {project.startDate} — {project.endDate}
          </span>
          <ProjectMembersDialog key={project.id} project={project} />
        </div>

        {project.description ? (
          <p className="text-sm text-text2">{project.description}</p>
        ) : (
          <button
            type="button"
            className="w-fit rounded-md py-1 text-sm text-text3 hover:text-text2"
          >
            {t(locale, "project.addDescription")}
          </button>
        )}

        <ProjectAttachments key={project.id} locale={locale} />
      </div>
    </div>
  )
}
