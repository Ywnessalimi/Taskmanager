"use client"

import { useState, type FormEvent } from "react"
import Image from "next/image"
import { useLocale, useT } from "@/components/providers/locale-provider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useInboxDashboard } from "./inbox-dashboard-provider"

const MAIN_ID = "main"

export function InboxDashboardSelector({ className = "" }: { className?: string }) {
  const t = useT()
  const { locale } = useLocale()
  const { currentDashboard, dashboards, selectDashboard, deleteDashboard } = useInboxDashboard()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const currentName = currentDashboard.isMain ? t("miniBar.inbox") : currentDashboard.name

  return <>
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={t("inboxDashboards.selectAria")} className={`flex min-w-0 items-center gap-1.5 rounded-md text-start text-base font-medium text-foreground hover:text-text2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${className}`}>
        <span className="truncate">{currentName}</span>
        <RemixIcon name="arrow-down-s-line" className="shrink-0 text-base text-icon2" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={locale === "en" ? "start" : "end"} className="min-w-52 rounded-xl p-1.5 shadow-none">
        <DropdownMenuItem onClick={() => selectDashboard(MAIN_ID)} className="min-h-9 gap-2">
          <RemixIcon name={currentDashboard.isMain ? "checkbox-circle-fill" : "home-4-line"} className="text-base text-icon2" />
          <span className="min-w-0 flex-1 truncate">{t("miniBar.inbox")}</span>
        </DropdownMenuItem>
        {dashboards.map((dashboard) => (
          <DropdownMenuItem key={dashboard.id} onClick={() => selectDashboard(dashboard.id)} className="min-h-9 gap-2">
            <RemixIcon name={currentDashboard.id === dashboard.id ? "checkbox-circle-fill" : "dashboard-line"} className="text-base text-icon2" />
            <span className="min-w-0 flex-1 truncate">{dashboard.name}</span>
          </DropdownMenuItem>
        ))}
        {!currentDashboard.isMain && <>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem onClick={() => setConfirmOpen(true)} variant="destructive" className="min-h-9 gap-2">
            <RemixIcon name="delete-bin-line" className="text-base" />
            {t("inboxDashboards.deleteAction")}
          </DropdownMenuItem>
        </>}
      </DropdownMenuContent>
    </DropdownMenu>
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DialogContent showCloseButton={false} className="gap-3 sm:max-w-sm">
        <DialogHeader className="text-start">
          <DialogTitle className="text-base">{t("inboxDashboards.deleteTitle")}</DialogTitle>
          <p className="text-sm leading-6 text-text2">{t("inboxDashboards.deleteDescription").replace("{name}", currentName)}</p>
        </DialogHeader>
        <div className="flex items-center justify-end gap-2">
          <DialogClose render={<Button type="button" variant="ghost" />}>{t("inboxDashboards.cancel")}</DialogClose>
          <Button type="button" variant="destructive" onClick={() => { deleteDashboard(currentDashboard.id); setConfirmOpen(false) }}>{t("inboxDashboards.deleteAction")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  </>
}

export function InboxDashboardCreateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT()
  const { locale } = useLocale()
  const { createDashboard } = useInboxDashboard()
  const [name, setName] = useState("")

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = name.trim()
    if (!value) return
    createDashboard(value)
    setName("")
    onOpenChange(false)
  }

  return <Dialog open={open} onOpenChange={(next) => { if (!next) setName(""); onOpenChange(next) }}>
    <DialogContent showCloseButton={false} className="max-h-[90dvh] gap-0 overflow-y-auto rounded-2xl p-0 shadow-none sm:max-w-md">
      <Image src="/images/inbox-dashboards/create-dashboard.webp" alt="" width={768} height={512} unoptimized className="h-36 w-full object-cover sm:h-44" />
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <DialogHeader className="gap-1 text-start">
          <DialogTitle className="text-base">{t("inboxDashboards.createTitle")}</DialogTitle>
          <p className="text-sm leading-6 text-text2">{t("inboxDashboards.createDescription")}</p>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <input autoFocus maxLength={40} dir={locale === "en" ? "ltr" : "rtl"} value={name} onChange={(event) => setName(event.target.value)} placeholder={t("inboxDashboards.namePlaceholder")} aria-label={t("inboxDashboards.namePlaceholder")} className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none placeholder:text-text3 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t("inboxDashboards.cancel")}</Button>
            <Button type="submit" disabled={!name.trim()} className="rounded-full px-4"><RemixIcon name="add-line" />{t("inboxDashboards.createAction")}</Button>
          </div>
        </form>
      </div>
    </DialogContent>
  </Dialog>
}
