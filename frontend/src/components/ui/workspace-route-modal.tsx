"use client"

import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useT } from "@/components/providers/locale-provider"

/** Renders an intercepted workspace route in the same frame used by task creation. */
export function WorkspaceRouteModal({ title, children, showHeader = true }: { title: string; children: ReactNode; showHeader?: boolean }) {
  const router = useRouter()
  const t = useT()

  return (
    <Dialog open onOpenChange={(open) => { if (!open) router.back() }}>
      <DialogContent
        variant="taskWorkspace"
        showCloseButton={false}
        overlayClassName="max-lg:hidden"
        className="bg-background text-[var(--task-workspace-text)] max-lg:top-0! max-lg:right-0! max-lg:bottom-0! max-lg:left-0! max-lg:h-dvh! max-lg:w-full! max-lg:max-w-none! max-lg:rounded-none! max-lg:border-0! max-lg:ring-0! lg:top-4 lg:right-4 lg:bottom-4"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="flex h-full min-h-0 flex-col">
          {showHeader && <header className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-[var(--task-workspace-border)] px-3">
            <span className="min-w-0 truncate text-sm text-[var(--task-workspace-secondary)]">{title}</span>
            <DialogClose aria-label={t("taskDetail.close")} className="grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--task-workspace-soft)]"><RemixIcon name="close-line" className="text-base" /></DialogClose>
          </header>}
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
