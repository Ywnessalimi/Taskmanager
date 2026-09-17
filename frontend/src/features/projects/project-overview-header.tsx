import Link from "next/link"
import { RemixIcon } from "@/components/ui/remix-icon"
import { MembersDialog } from "@/features/organizations/members-dialog"
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
        <h1 className="truncate text-xl font-medium text-foreground">{project.name}</h1>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            href={`/home/organizations/${project.organizationId}`}
            className="text-brand hover:underline"
          >
            {project.organizationName}
          </Link>
          <span className="h-4 w-px bg-border" />
          <MembersDialog members={project.members} />
          <span className="h-4 w-px bg-border" />
          <span
            dir="ltr"
            aria-label={t(locale, "project.timeline")}
            className="flex items-center gap-1.5 text-text2"
          >
            <RemixIcon name="calendar-line" className="text-base" />
            {project.startDate} — {project.endDate}
          </span>
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

        <button
          type="button"
          className="flex w-fit items-center gap-1.5 rounded-md py-1.5 text-sm text-text2 hover:text-foreground"
        >
          <RemixIcon name="attachment-line" className="text-base" />
          {t(locale, "project.addAttachment")}
        </button>
      </div>
    </div>
  )
}
