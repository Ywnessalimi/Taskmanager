"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useLocale, useT } from "@/components/providers/locale-provider"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { RemixIcon } from "@/components/ui/remix-icon"
import type { CurrentUser } from "@/lib/api/types"
import { localeDir } from "@/lib/i18n/dictionary"
import { getTickets } from "./ticket-data"
import type { LocalTicket } from "./local-created-tickets"
import { TicketWorkspace } from "./ticket-create-form"
import { TicketInbox } from "./ticket-inbox"

export function TicketDetail({ ticketId, user, modalOnly = false }: { ticketId: string; user: CurrentUser; modalOnly?: boolean }) {
  const t = useT()
  const { locale } = useLocale()
  const dir = localeDir(locale)
  const router = useRouter()
  const [result, setResult] = useState<{ ticketId: string; ticket: LocalTicket | null } | null>(null)

  useEffect(() => {
    function load() {
      void getTickets(locale).then((tickets) => {
        setResult({ ticketId, ticket: tickets.find((item) => item.id === ticketId) ?? null })
      }).catch(() => setResult({ ticketId, ticket: null }))
    }
    load()
    window.addEventListener("tickets-changed", load)
    window.addEventListener("storage", load)
    return () => {
      window.removeEventListener("tickets-changed", load)
      window.removeEventListener("storage", load)
    }
  }, [locale, ticketId])

  const loaded = result?.ticketId === ticketId
  const ticket = result?.ticketId === ticketId ? result.ticket : null

  if (ticket) {
    return (
      <>
        {!modalOnly && <div className="hidden min-h-0 flex-1 lg:flex"><TicketInbox user={user} /></div>}
        <Dialog open onOpenChange={(open) => { if (!open) router.back() }}>
          <DialogContent variant="taskWorkspace" showCloseButton={false} overlayClassName="max-lg:hidden" className="bg-background text-[var(--task-workspace-text)] max-lg:top-0! max-lg:right-0! max-lg:bottom-0! max-lg:left-0! max-lg:h-dvh! max-lg:w-full! max-lg:max-w-none! max-lg:rounded-none! max-lg:border-0! max-lg:ring-0! lg:top-4 lg:right-4 lg:bottom-4">
            <DialogTitle className="sr-only">{ticket.title || t("inbox.detailTitle")}</DialogTitle>
            <TicketWorkspace user={user} ticket={ticket} onDone={() => router.back()} />
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      {!modalOnly && <div className="hidden min-h-0 flex-1 lg:flex"><TicketInbox user={user} /></div>}
      <Dialog open onOpenChange={(open) => { if (!open) router.back() }}>
        <DialogContent variant="taskWorkspace" showCloseButton={false} overlayClassName="max-lg:hidden" className="bg-background text-[var(--task-workspace-text)] max-lg:top-0! max-lg:right-0! max-lg:bottom-0! max-lg:left-0! max-lg:h-dvh! max-lg:w-full! max-lg:max-w-none! max-lg:rounded-none! max-lg:border-0! max-lg:ring-0! lg:top-4 lg:right-4 lg:bottom-4">
          <DialogTitle className="sr-only">{t("inbox.detailTitle")}</DialogTitle>
          <div className="flex h-full min-h-0 flex-col">
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--task-workspace-border)] px-4 lg:h-11 lg:px-2">
              <h1 className="text-base font-medium">{t("inbox.detailTitle")}</h1>
              <DialogClose aria-label={t("taskDetail.close")} className="grid size-8 place-items-center rounded-lg bg-[var(--task-workspace-soft)]">
                <span className="lg:hidden"><RemixIcon name={dir === "rtl" ? "arrow-right-line" : "arrow-left-line"} className="text-xl" /></span>
                <span className="hidden lg:block"><RemixIcon name="close-line" className="text-lg" /></span>
              </DialogClose>
            </header>
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm text-text2">{loaded ? t("inbox.ticketNotFound") : t("inbox.loadingTicket")}</p>
              {loaded && <Link href="/inbox" className="text-sm text-link">{t("inbox.backToInbox")}</Link>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
