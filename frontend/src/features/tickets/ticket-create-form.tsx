"use client"

import { BottomTabBar } from "@/components/navigation/bottom-tab-bar"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useT } from "@/components/providers/locale-provider"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NewTaskAsset } from "@/features/tasks/new-task-assets"
import { MobileTaskAsset } from "@/features/tasks/mobile-task-assets"
import { NewTaskActivity } from "@/features/tasks/new-task-activity"
import { saveLocalTicket, deleteLocalTicket, type LocalTicket } from "./local-created-tickets"
import type { CurrentUser, TicketPermission, TicketStatus, TicketSubject } from "@/lib/api/types"
import type { TranslationKey } from "@/lib/i18n/dictionary"

const SUBJECTS: { value: TicketSubject; label: TranslationKey }[] = [{ value: "general", label: "ticket.general" }, { value: "hr", label: "ticket.hr" }, { value: "purchasing", label: "ticket.purchasing" }, { value: "warehouse", label: "ticket.warehouse" }]
const STATUSES: { value: TicketStatus; label: TranslationKey }[] = [{ value: "open", label: "ticket.open" }, { value: "in-review", label: "ticket.inReview" }, { value: "closed", label: "ticket.closed" }]
const PERMISSIONS: { value: TicketPermission; label: TranslationKey }[] = [{ value: "salary-payment", label: "ticket.salaryPayment" }, { value: "purchase", label: "ticket.purchase" }, { value: "warehouse-release", label: "ticket.warehouseRelease" }, { value: "other", label: "ticket.other" }]
const FIELD = "flex min-h-6 w-full items-center gap-6 text-start"

/** فرم مشترک تیکت؛ دو چیدمان CSS با state واحد و ساخت خودکار محلی. */
function TicketWorkspace({ user, onDone, ticket }: { user: CurrentUser; onDone: () => void; ticket?: LocalTicket }) {
  const t = useT()
  const [title, setTitle] = useState(ticket?.title ?? ""), [description, setDescription] = useState(ticket?.description ?? "")
  const [subject, setSubject] = useState<TicketSubject>(ticket?.subject ?? "general"), [status, setStatus] = useState<TicketStatus>(ticket?.status ?? "open")
  const [permissions, setPermissions] = useState<TicketPermission[]>(ticket?.permissionIds ?? [])
  const [following, setFollowing] = useState(false), [favorite, setFavorite] = useState(false), [tab, setTab] = useState("activities")
  const [files, setFiles] = useState<string[]>([]), [error, setError] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null), id = useRef<string | null>(ticket?.id ?? null), removed = useRef(false)
  const lastSaved=useRef<string | null>(null)
  useEffect(() => {
    if (removed.current || (!id.current && !title.trim() && !description.trim())) return
    id.current ??= crypto.randomUUID()
    const input={createdById:ticket?.createdById??user.id,createdByName:ticket?.createdByName??user.name,title:title.trim(),subject,status,permissionIds:permissions,description:description||undefined}
    const signature=JSON.stringify(input)
    if(ticket&&lastSaved.current===null){lastSaved.current=signature;return}
    if(lastSaved.current===signature)return
    void saveLocalTicket(id.current,input).then(()=>{lastSaved.current=signature;setError(false)}).catch(()=>setError(true))
  }, [ticket, title, subject, status, permissions, description, ticket?.createdById, ticket?.createdByName, user.id, user.name])
  async function remove() {
    try { if (id.current) await deleteLocalTicket(id.current); removed.current = true; onDone() }
    catch { setError(true) }
  }

  return <div className="flex h-full min-h-0 flex-col text-[var(--task-workspace-text)]">
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--task-workspace-border)] px-4 lg:h-11 lg:px-2">
      <button type="button" aria-label={t("taskDetail.close")} onClick={onDone} className="lg:order-2 lg:rounded-lg lg:bg-bg2 lg:p-1"><span className="lg:hidden"><MobileTaskAsset name="back" className="ltr:rotate-180" /></span><span className="hidden lg:block"><NewTaskAsset name="close-fill" /></span></button>
      <span className="hidden items-center gap-2 text-sm lg:flex"><NewTaskAsset name="chat-smile-line" />{t("ticket.title")}</span>
      <div className="flex items-center gap-4 lg:ms-auto">
        <span aria-hidden="true" className="flex items-center gap-4 lg:hidden"><MobileTaskAsset name="up" /><MobileTaskAsset name="down" /><MobileTaskAsset name="divider" className="rotate-90" /></span>
        <DropdownMenu><DropdownMenuTrigger aria-label={t("mobileTask.options")}><MobileTaskAsset name="more" /></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onClick={() => setTab("details")}>{t("mobileTask.moreDetails")}</DropdownMenuItem><DropdownMenuItem onClick={remove} className="text-destructive">{t("ticket.delete")}</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
      </div>
    </header>
    {error && <p role="alert" className="px-4 py-2 text-xs text-error">{t("ticket.error")}</p>}
    <div className="min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1fr)_361px] lg:overflow-hidden">
      <div className="lg:min-h-0 lg:overflow-y-auto">
        <div className="px-4 pt-3 lg:px-6">
          <div className="flex items-center justify-between gap-2"><span className="text-sm text-[var(--task-workspace-muted)]">{t("newTask.newRequest")}</span><div className="flex items-center gap-2"><button type="button" aria-pressed={following} onClick={() => setFollowing(!following)} className="flex h-8 items-center gap-1 rounded-lg border border-border px-1.5 text-xs"><NewTaskAsset name="eye-line" />{t(following ? "newTask.following" : "newTask.follow")}</button><button type="button" aria-label={t("taskDetail.favorite")} aria-pressed={favorite} onClick={() => setFavorite(!favorite)} className={`flex size-8 items-center justify-center rounded-lg border border-border ${favorite ? "bg-bg2" : ""}`}><NewTaskAsset name="heart3-line" /></button></div></div>
          <div className="flex items-center gap-3 pt-5 pb-6"><DropdownMenu><DropdownMenuTrigger aria-label={t("ticket.status")}><NewTaskAsset name="frame122" /></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuRadioGroup value={status} onValueChange={value => setStatus(value as TicketStatus)}>{STATUSES.map(option => <DropdownMenuRadioItem key={option.value} value={option.value}>{t(option.label)}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu><MobileTaskAsset name="status-divider" className="rotate-90" /><input autoFocus aria-label={t("ticket.name")} placeholder={t("ticket.name")} value={title} onChange={event => setTitle(event.target.value)} className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none placeholder:text-text3" /></div>
          <div className="grid gap-4 pb-6 lg:grid-cols-2">
            <DropdownMenu><DropdownMenuTrigger className={FIELD}><span className="flex w-30 shrink-0 items-center gap-1.5 text-[13px] text-text3"><NewTaskAsset name="chat-smile-line" />{t("ticket.subject")}</span><span className="text-[13px]">{t(SUBJECTS.find(option => option.value === subject)!.label)}</span></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuRadioGroup value={subject} onValueChange={value => setSubject(value as TicketSubject)}>{SUBJECTS.map(option => <DropdownMenuRadioItem key={option.value} value={option.value}>{t(option.label)}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu>
            <DropdownMenu><DropdownMenuTrigger className={FIELD}><span className="flex w-30 shrink-0 items-center gap-1.5 text-[13px] text-text3"><NewTaskAsset name="flag-line" />{t("ticket.status")}</span><span className="text-[13px]">{t(STATUSES.find(option => option.value === status)!.label)}</span></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuRadioGroup value={status} onValueChange={value => setStatus(value as TicketStatus)}>{STATUSES.map(option => <DropdownMenuRadioItem key={option.value} value={option.value}>{t(option.label)}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu>
            <DropdownMenu><DropdownMenuTrigger className={`${FIELD} lg:col-span-2`}><span className="flex w-30 shrink-0 items-center gap-1.5 text-[13px] text-text3"><NewTaskAsset name="list-check3" />{t("ticket.permissions")}</span><span className="flex min-w-0 flex-wrap gap-1 text-xs">{permissions.length ? permissions.map(value => <span key={value} className="rounded-lg bg-bg2 px-2 py-1">{t(PERMISSIONS.find(option => option.value === value)!.label)}</span>) : t("newTask.unselected")}</span></DropdownMenuTrigger><DropdownMenuContent>{PERMISSIONS.map(option => <DropdownMenuCheckboxItem key={option.value} checked={permissions.includes(option.value)} onCheckedChange={checked => setPermissions(values => checked ? [...values, option.value] : values.filter(value => value !== option.value))}>{t(option.label)}</DropdownMenuCheckboxItem>)}</DropdownMenuContent></DropdownMenu>
          </div>
        </div>
        <Tabs value={tab} onValueChange={value => setTab(value as string)} className="gap-0 lg:hidden"><TabsList variant="line" className="group-data-horizontal/tabs:h-12 w-full justify-start gap-4 border-b border-border bg-[var(--task-workspace-bg)] px-4">{[{value:"details",label:"mobileTask.moreDetails",icon:"details"},{value:"activities",label:"newTask.activities",icon:"activities"}].map(item => <TabsTrigger key={item.value} value={item.value} className="h-full flex-none gap-2 text-xs after:rounded-t-[4px] after:bg-[#141a1a] group-data-horizontal/tabs:after:bottom-0 group-data-horizontal/tabs:after:h-[5px]"><MobileTaskAsset name={item.icon as "details" | "activities"} />{t(item.label as TranslationKey)}</TabsTrigger>)}</TabsList></Tabs>
        <div className={`${tab === "details" ? "flex" : "hidden"} flex-col gap-4 p-4 lg:flex lg:px-6`}><textarea aria-label={t("ticket.description")} placeholder={t("ticket.description")} value={description} onChange={event => setDescription(event.target.value)} className="min-h-36 w-full rounded-lg border border-border bg-background p-3 outline-none" /><button type="button" onClick={() => fileInput.current?.click()} className="flex items-center gap-2 text-sm text-text2"><NewTaskAsset name="attachment2" />{t("taskForm.attachFile")}</button><input ref={fileInput} type="file" multiple className="hidden" onChange={event => setFiles(Array.from(event.target.files ?? []).map(file => file.name))} />{files.map(file => <button type="button" key={file} onClick={() => setFiles(values => values.filter(value => value !== file))} className="w-fit rounded-lg bg-bg2 px-2 py-1 text-xs">{file} ×</button>)}</div>
      </div>
      <div className={`${tab === "activities" ? "flex" : "hidden"} min-h-80 flex-col lg:flex lg:min-h-0 lg:border-s lg:border-border`}><NewTaskActivity inline user={user} members={[]} following={following} onFollowingChange={setFollowing} /></div>
    </div>
  </div>
}

export function TicketCreateDialog({ user, onDone, ticket }: { user: CurrentUser; onDone: () => void; ticket?: LocalTicket }) {
  const t = useT()
  return <DialogContent variant="taskWorkspace" showCloseButton={false} overlayClassName="max-lg:hidden" className="bg-background max-lg:top-0! max-lg:right-0! max-lg:bottom-0! max-lg:left-0! max-lg:w-full! max-lg:max-w-none! max-lg:rounded-none! max-lg:border-0!"><DialogTitle className="sr-only">{t("ticket.title")}</DialogTitle><div className="h-full min-h-0 max-lg:pb-20"><TicketWorkspace user={user} onDone={onDone} ticket={ticket} /></div><BottomTabBar /></DialogContent>
}

export function TicketCreateForm({ user }: { user: CurrentUser }) {
  const router = useRouter(), t = useT()
  const [open, setOpen] = useState(true)
  const finish = () => { setOpen(false); router.back() }
  return <Dialog open={open} onOpenChange={value => { if (!value) finish() }}><DialogContent variant="taskWorkspace" showCloseButton={false} overlayClassName="max-lg:hidden" className="max-lg:top-0! max-lg:right-0! max-lg:bottom-0! max-lg:left-0! max-lg:h-dvh! max-lg:w-full! max-lg:max-w-none! max-lg:rounded-none! max-lg:border-0! max-lg:ring-0! lg:top-4 lg:right-4 lg:bottom-4"><DialogTitle className="sr-only">{t("ticket.title")}</DialogTitle><div className="h-full min-h-0 max-lg:pb-20"><TicketWorkspace user={user} onDone={finish} /></div><BottomTabBar /></DialogContent></Dialog>
}
