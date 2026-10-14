import Link from "next/link"
import { RemixIcon } from "@/components/ui/remix-icon"
import { getLocale } from "@/lib/i18n/server"
import { localeDir, t } from "@/lib/i18n/dictionary"

export default async function TicketDetailPlaceholder({
  params,
}: {
  params: Promise<{ ticketId: string }>
}) {
  const [{ ticketId }, locale] = await Promise.all([params, getLocale()])
  const backIcon = localeDir(locale) === "rtl" ? "arrow-right-line" : "arrow-left-line"

  return (
    <section className="flex min-h-[calc(100dvh-5rem)] flex-1 flex-col bg-[var(--project-surface)] lg:min-h-0">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--task-workspace-border)] bg-background px-4">
        <Link href="/inbox" aria-label={t(locale, "pageHeader.back")} className="grid size-9 place-items-center text-[var(--task-workspace-text)]">
          <RemixIcon name={backIcon} className="text-xl" />
        </Link>
        <h1 className="text-base font-medium text-[var(--task-workspace-text)]">{t(locale, "inbox.detailTitle")}</h1>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm text-text2">{t(locale, "inbox.detailNotReady")}</p>
        <p dir="ltr" className="text-xs text-text3">{ticketId}</p>
      </div>
    </section>
  )
}
