"use client"

import { useT } from "@/components/providers/locale-provider"
import { useState } from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useTaskPanel } from "@/components/providers/task-panel-provider"
import { RemixIcon } from "@/components/ui/remix-icon"
import { Dialog } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { NewTaskAsset } from "./new-task-assets"
import { NewTaskDialog } from "./new-task-dialog"
import { TicketCreateDialog } from "@/features/tickets/ticket-create-form"
import type { CurrentUser } from "@/lib/api/types"

/**
 * منوی «جدید» سراسری؛ انتخاب تسک جدید مودال مستقل ساخت را باز می‌کند.
 *
 * روی موبایل این دکمه دیده نمی‌شود؛ آنجا `AddTaskFab` به صفحه‌ی کامل `/tasks/new` می‌برد.
 */
export function NewTaskButton({ figmaStyle = false, user }: { figmaStyle?: boolean; user: CurrentUser }) {
  const t = useT()
  const panel = useTaskPanel()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [ticketOpen, setTicketOpen] = useState(false)
  const projectId = pathname.match(/^\/home\/projects\/([^/]+)(?:\/|$)/)?.[1]

  return (
    <>
    <DropdownMenu>
    <DropdownMenuTrigger
      className={figmaStyle ? "flex h-8 items-center gap-1 rounded-full bg-[var(--mini-bar-bg)] px-2.5 text-xs font-medium text-white hover:opacity-90" : "flex h-8 items-center gap-1.5 rounded-md bg-brand px-2.5 text-xs font-medium text-text-on-brand hover:opacity-90"}
    >
      {figmaStyle ? <Image src="/images/figma/project-header/add.svg" alt="" width={20} height={20} /> : <RemixIcon name="add-circle-line" className="text-base" />}
      {t(figmaStyle ? "nav.new" : "nav.newTask")}
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" sideOffset={8} className="flex w-[218px] flex-col gap-3 rounded-lg px-2 py-4 shadow-none">
      <DropdownMenuItem onClick={() => setOpen(true)} className="h-[21px] gap-2 rounded px-0 py-0 font-medium"><NewTaskAsset name="task-line" />{t("nav.newTask")}</DropdownMenuItem>
      <DropdownMenuItem disabled title={t("newTask.notAvailable")} className="h-[21px] gap-2 rounded px-0 py-0 font-medium data-disabled:opacity-100"><NewTaskAsset name="folder-add-line" />{t("newTask.newProject")}</DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTicketOpen(true)} className="h-[21px] gap-2 rounded px-0 py-0 font-medium"><NewTaskAsset name="chat-smile-line" />{t("newTask.newRequest")}</DropdownMenuItem>
    </DropdownMenuContent>
    </DropdownMenu>
    <Dialog open={open} onOpenChange={setOpen}>
      {open && <NewTaskDialog projects={panel?.projects ?? []} defaultProjectId={projectId} user={user} onDone={() => setOpen(false)} />}
    </Dialog>
    <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
      {ticketOpen && <TicketCreateDialog user={user} onDone={() => setTicketOpen(false)} />}
    </Dialog>
    </>
  )
}
