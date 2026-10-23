"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useT } from "@/components/providers/locale-provider"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NewTaskAsset } from "@/features/tasks/new-task-assets"
import { MobileTaskAsset } from "@/features/tasks/mobile-task-assets"
import { Button } from "@/components/ui/button"
import { displayId, showWorkspaceToast } from "@/lib/workspace-toast"
import { RemixIcon } from "@/components/ui/remix-icon"
import { NewTaskActivity } from "@/features/tasks/new-task-activity"
import { useTaskPanel } from "@/components/providers/task-panel-provider"
import { STATUS_COLUMNS, STATUS_COLUMN_ICON } from "@/features/projects/task-display"
import { createTicketComment, listTicketComments, listTicketActivity, saveTicket } from "@/lib/api/ticket-comments"
import { saveLocalTicket, deleteLocalTicket, type LocalTicket } from "./local-created-tickets"
import type { CurrentUser, TaskFormProjectOption, TicketPermission, TicketPriority, TicketStatus, TicketSubject } from "@/lib/api/types"
import type { TranslationKey } from "@/lib/i18n/dictionary"

const SUBJECTS: { value: TicketSubject; label: TranslationKey }[] = [{ value: "general", label: "ticket.general" }, { value: "hr", label: "ticket.hr" }, { value: "purchasing", label: "ticket.purchasing" }, { value: "warehouse", label: "ticket.warehouse" }]
const STATUS_LABELS: Record<TicketStatus, TranslationKey> = { todo: "status.todo", "in-progress": "status.inProgress", completed: "status.completed" }
const STATUSES = STATUS_COLUMNS.map((column) => ({ value: column.id, label: STATUS_LABELS[column.id], icon: STATUS_COLUMN_ICON[column.id] }))
const PERMISSIONS: { value: TicketPermission; label: TranslationKey }[] = [{ value: "salary-payment", label: "ticket.salaryPayment" }, { value: "purchase", label: "ticket.purchase" }, { value: "warehouse-release", label: "ticket.warehouseRelease" }, { value: "other", label: "ticket.other" }]
const PRIORITIES: { value: TicketPriority; label: TranslationKey }[] = [{ value: "none", label: "priority.none" }, { value: "low", label: "priority.low" }, { value: "medium", label: "priority.medium" }, { value: "high", label: "priority.high" }, { value: "urgent", label: "priority.urgent" }]
const FIELD = "flex w-full min-w-0 items-center gap-3 rounded-md py-1 text-start hover:bg-bg2"
const FIELD_LABEL = "flex w-30 shrink-0 items-center gap-1.5 text-[13px] text-[var(--task-workspace-muted)]"
type TicketAttachment = { id: string; name: string; previewUrl?: string; icon: string }

function attachmentIcon(name: string) {
  const extension = name.split(".").pop()?.toLowerCase()
  if (extension === "pdf") return "file-pdf-2-line"
  if (["xls", "xlsx", "csv"].includes(extension ?? "")) return "file-excel-2-line"
  if (["doc", "docx"].includes(extension ?? "")) return "file-word-2-line"
  return "file-line"
}

function StatusIcon({ icon, className = "" }: { icon: string; className?: string }) {
  return <RemixIcon name={icon === "figma-progress" ? "play-circle-fill" : icon} className={`inline-flex size-[18px] shrink-0 items-center justify-center leading-none ${className}`} />
}

/** فرم مشترک تیکت؛ دو چیدمان CSS با state واحد و ساخت خودکار محلی. */
export function TicketWorkspace({ user, onDone, ticket, projectId, projects = [] }: { user: CurrentUser; onDone: () => void; ticket?: LocalTicket; projectId?: string; projects?: TaskFormProjectOption[] }) {
  const t = useT()
  const taskPanel = useTaskPanel()
  const [title, setTitle] = useState(ticket?.title ?? ""), [description, setDescription] = useState(ticket?.description ?? "")
  const [subject, setSubject] = useState<TicketSubject>(ticket?.subject ?? "general"), [status, setStatus] = useState<TicketStatus>(ticket?.status ?? "todo")
  const [priority, setPriority] = useState<TicketPriority>(ticket?.priority ?? "none")
  const [selectedProjectId, setSelectedProjectId] = useState(ticket?.projectId ?? projectId ?? "")
  const [selectedAssigneeId, setSelectedAssigneeId] = useState(ticket?.assigneeId ?? "")
  const [assigneeDialogOpen, setAssigneeDialogOpen] = useState(false)
  const [permissions, setPermissions] = useState<TicketPermission[]>(ticket?.permissionIds ?? [])
  const [following, setFollowing] = useState(ticket?.followers?.includes(user.id) ?? false), [favorite, setFavorite] = useState(ticket?.favorites?.includes(user.id) ?? false), [tab, setTab] = useState("details")
  const canComment = Boolean(ticket || title.trim())
  const [files, setFiles] = useState<TicketAttachment[]>([]), [error, setError] = useState(false), [isSubmitting, setIsSubmitting] = useState(false)
  const [failedSignature, setFailedSignature] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null), attachmentUrls = useRef<string[]>([]), id = useRef<string>(ticket?.id ?? crypto.randomUUID()), removed = useRef(false)
  useEffect(() => () => attachmentUrls.current.forEach((url) => URL.revokeObjectURL(url)), [])
  const [initialSignature, setInitialSignature] = useState(() => ticket ? JSON.stringify([ticket.title, ticket.subject, ticket.status, ticket.projectId ?? "", ticket.assigneeId ?? "", ticket.permissionIds, ticket.description ?? "", ticket.priority ?? "none", ticket.followers?.includes(user.id) ?? false, ticket.favorites?.includes(user.id) ?? false]) : null)
  const availableProjects = projects.length ? projects : taskPanel?.projects ?? []
  const candidateMembers = selectedProjectId
    ? availableProjects.find((project) => project.id === selectedProjectId)?.members ?? []
    : Array.from(new Map(availableProjects.flatMap((project) => project.members).map((member) => [member.id, member])).values())
  const selectedAssignee = candidateMembers.find((member) => member.id === selectedAssigneeId)
  const assigneeName = selectedAssignee?.name ?? (selectedAssigneeId === ticket?.assigneeId ? ticket?.assigneeName : undefined)
  const assigneeAvatarUrl = selectedAssignee?.avatarUrl ?? ticket?.assigneeAvatarUrl
  const currentInput = {
    projectId: selectedProjectId || undefined,
    assigneeId: selectedAssigneeId || undefined,
    createdById: ticket?.createdById ?? user.id, createdByName: ticket?.createdByName ?? user.name, createdByAvatarUrl: ticket?.createdByAvatarUrl ?? user.avatarUrl,
    assigneeName: selectedAssignee?.name,
    assigneeAvatarUrl: selectedAssignee?.avatarUrl,
    title: title.trim(), subject, status, permissionIds: permissions, description: description || undefined, priority,
    followers: following ? [user.id] : [], favorites: favorite ? [user.id] : [],
  }
  const currentSignature = JSON.stringify([title, subject, status, selectedProjectId, selectedAssigneeId, permissions, description, priority, following, favorite])
  const hasChanges = ticket ? currentSignature !== initialSignature : Boolean(title.trim() || description.trim())
  const commentStore = useMemo(() => {
    if (!canComment) return undefined
    const ticketId = id.current
    return {
      list: () => listTicketComments(ticketId),
      create: (text: string) => createTicketComment(ticketId, { authorId: user.id, authorName: user.name, authorAvatarUrl: user.avatarUrl, text }),
    }
  }, [canComment, user.id, user.name, user.avatarUrl])
  const activityStore = useMemo(() => ticket ? { list: async () => {
    await saveTicket(ticket.id, { ...ticket, followers: ticket.followers ?? [], favorites: ticket.favorites ?? [] }, { id: user.id, name: user.name, avatarUrl: user.avatarUrl })
    return listTicketActivity(ticket.id)
  } } : undefined, [ticket, user.id, user.name, user.avatarUrl])
  async function remove() {
    try { if (ticket) await deleteLocalTicket(ticket.id); removed.current = true; if (ticket) showWorkspaceToast(t("workspace.deleted").replace("{id}", displayId(ticket.id))); onDone() }
    catch { setError(true) }
  }
  async function copyTicketLink() {
    if (!ticket) return
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/inbox/${ticket.id}`)
      showWorkspaceToast(t("ticket.linkCopied"))
    } catch {
      setError(true)
    }
  }
  function removeAttachment(fileId: string) {
    const removedFile = files.find((file) => file.id === fileId)
    if (removedFile?.previewUrl) {
      URL.revokeObjectURL(removedFile.previewUrl)
      attachmentUrls.current = attachmentUrls.current.filter((url) => url !== removedFile.previewUrl)
    }
    setFiles((current) => current.filter((file) => file.id !== fileId))
  }
  function addFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.currentTarget.files ?? []).map((file) => {
      const isImage = file.type.startsWith("image/") || /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(file.name)
      const previewUrl = isImage ? URL.createObjectURL(file) : undefined
      if (previewUrl) attachmentUrls.current.push(previewUrl)
      return { id: crypto.randomUUID(), name: file.name, previewUrl, icon: attachmentIcon(file.name) }
    })
    setFiles((current) => [...current, ...selected])
    event.currentTarget.value = ""
  }
  async function submit() {
    if (!title.trim() || isSubmitting || !hasChanges) return
    setIsSubmitting(true)
    id.current ??= crypto.randomUUID()
    try {
      await saveLocalTicket(id.current, currentInput)
      if (ticket) setInitialSignature(currentSignature)
      setFailedSignature(null)
      setError(false)
      if (!ticket) {
        showWorkspaceToast(t("workspace.created").replace("{id}", displayId(id.current)))
        onDone()
      }
    } catch {
      setError(true)
      setFailedSignature(currentSignature)
    } finally {
      setIsSubmitting(false)
    }
  }
  const saveDisabled = !title.trim() || Boolean(ticket && !hasChanges)

  useEffect(() => {
    if (!ticket || !hasChanges || !title.trim() || isSubmitting || failedSignature === currentSignature) return
    const timeout = window.setTimeout(() => { void submit() }, 650)
    return () => window.clearTimeout(timeout)
    // submit uses the form snapshot captured by this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket, currentSignature, hasChanges, title, isSubmitting, failedSignature])

  return <div className="flex h-full min-h-0 flex-col text-[var(--task-workspace-text)]">
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--task-workspace-border)] px-4 lg:h-11 lg:px-2">
      <div className="flex min-w-0 items-center gap-2 text-sm"><NewTaskAsset name="chat-smile-line" /><span className="truncate">{t(ticket ? "inbox.detailTitle" : "ticket.title")}</span></div>
      <div className="flex shrink-0 items-center gap-3">
        {ticket && <DropdownMenu><DropdownMenuTrigger aria-label={t("mobileTask.options")} className="grid size-8 place-items-center rounded-md hover:bg-[var(--task-workspace-soft)]"><MobileTaskAsset name="more" /></DropdownMenuTrigger><DropdownMenuContent align="start" className="w-48 rounded-xl border border-[var(--task-workspace-border)] p-1.5 shadow-none"><DropdownMenuItem onClick={() => setTab("details")} className="min-h-9 gap-2 rounded-lg"><RemixIcon name="file-list-3-line" className="text-base text-[var(--task-workspace-muted)]" />{t("mobileTask.moreDetails")}</DropdownMenuItem><DropdownMenuItem onClick={() => void copyTicketLink()} className="min-h-9 gap-2 rounded-lg"><RemixIcon name="link" className="text-base text-[var(--task-workspace-muted)]" />{t("ticket.copyLink")}</DropdownMenuItem><DropdownMenuSeparator className="my-1" /><DropdownMenuItem onClick={remove} className="min-h-9 gap-2 rounded-lg text-destructive"><RemixIcon name="delete-bin-6-line" className="text-base" />{t("ticket.delete")}</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}
        {!ticket && <Button type="button" onClick={() => void submit()} disabled={saveDisabled || isSubmitting} className="h-8 min-w-20 rounded-lg bg-brand px-3 text-xs font-semibold text-white hover:opacity-90">{t("workspace.register")}</Button>}
        <DialogClose aria-label={t("taskDetail.close")} onClick={() => { if (ticket && hasChanges) void submit() }} className="grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--task-workspace-soft)]"><NewTaskAsset name="close-fill" /></DialogClose>
      </div>
    </header>
    {error && <p role="alert" className="px-4 py-2 text-xs text-error">{t("ticket.error")}</p>}
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_361px]">
      <div className={`${tab === "activities" ? "shrink-0" : "min-h-0 flex-1 overflow-y-auto"} lg:min-h-0 lg:overflow-y-auto`}>
        <div className="px-4 pt-3 lg:px-6">
          <div className="flex items-center justify-between gap-2"><span className="text-sm text-[var(--task-workspace-muted)]">{t(ticket ? "inbox.detailTitle" : "newTask.newRequest")}</span><div className="flex items-center gap-2"><button type="button" aria-pressed={following} onClick={() => setFollowing(!following)} className={`flex h-8 items-center gap-1 rounded-lg border border-border px-1.5 text-xs ${following ? "bg-[#141a1a] text-white" : ""}`}><RemixIcon name={following ? "eye-fill" : "eye-line"} />{t(following ? "newTask.following" : "newTask.follow")}</button><button type="button" aria-label={t("taskDetail.favorite")} aria-pressed={favorite} onClick={() => setFavorite(!favorite)} className={`flex size-8 items-center justify-center rounded-lg border border-border ${favorite ? "text-error" : ""}`}><RemixIcon name={favorite ? "heart-fill" : "heart-line"} className="text-base" /></button></div></div>
          <div className="flex items-center gap-3 pt-5 pb-6"><DropdownMenu><DropdownMenuTrigger aria-label={t("ticket.status")} className="flex h-8 items-center gap-1 rounded-md px-1 hover:bg-bg2"><span className="grid size-6 shrink-0 place-items-center"><StatusIcon icon={STATUS_COLUMN_ICON[status]} /></span><RemixIcon name="arrow-down-s-line" className="text-sm leading-none text-[var(--task-workspace-muted)]" /></DropdownMenuTrigger><DropdownMenuContent align="start" className="w-52 rounded-xl border border-border p-1.5 shadow-none"><DropdownMenuRadioGroup value={status} onValueChange={value => setStatus(value as TicketStatus)}>{STATUSES.map(option => <DropdownMenuRadioItem key={option.value} value={option.value} className="min-h-9 gap-2 rounded-lg px-2"><StatusIcon icon={option.icon} />{t(option.label)}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu><MobileTaskAsset name="status-divider" className="rotate-90" /><input autoFocus aria-label={t("ticket.name")} placeholder={t("ticket.name")} value={title} onChange={event => setTitle(event.target.value)} className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none placeholder:text-[var(--task-workspace-muted)]" /></div>
          <div className="grid grid-cols-1 gap-4 pb-4 min-[850px]:grid-cols-2 min-[850px]:gap-6">
            <div className="order-[-1]">
              <button type="button" onClick={() => setAssigneeDialogOpen(true)} className={FIELD}>
                <span className={FIELD_LABEL}><RemixIcon name="user-follow-line" className="size-4" />{t("ticket.assignee")}</span>
                {assigneeName ? <span className="flex min-w-0 items-center gap-2 text-[13px] text-[var(--task-workspace-muted)]"><Avatar className="size-6 shrink-0"><AvatarImage src={assigneeAvatarUrl} alt={assigneeName} /><AvatarFallback>{assigneeName.slice(0, 1)}</AvatarFallback></Avatar><span className="truncate">{assigneeName}</span></span> : <span className="text-[13px] text-[var(--task-workspace-muted)]">{t("ticket.unassigned")}</span>}
                <RemixIcon name="arrow-down-s-line" className="text-base text-[var(--task-workspace-muted)]" />
              </button>
              <Dialog open={assigneeDialogOpen} onOpenChange={setAssigneeDialogOpen}>
                <DialogContent variant="fullscreen" className="sm:max-w-[39.2rem]" onClick={event => event.stopPropagation()}>
                  <DialogHeader className="border-b border-border px-4 py-3"><DialogTitle>{t("ticket.assign")}</DialogTitle></DialogHeader>
                  <div className="min-h-0 flex-1 overflow-y-auto p-2">
                    <button type="button" onClick={() => { setSelectedAssigneeId(""); setAssigneeDialogOpen(false) }} className="flex w-full items-center gap-3 rounded-md p-2 text-start text-sm text-foreground hover:bg-bg2">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-bg2"><RemixIcon name="user-unfollow-line" className="text-lg text-text2" /></span>
                      <span className="flex-1">{t("ticket.unassigned")}</span>
                      {!selectedAssigneeId && <RemixIcon name="check-line" className="text-base" />}
                    </button>
                    {candidateMembers.map(member => <button key={member.id} type="button" onClick={() => { setSelectedAssigneeId(member.id); setAssigneeDialogOpen(false) }} className="flex w-full items-center gap-3 rounded-md p-2 text-start text-sm text-foreground hover:bg-bg2">
                      <Avatar className="size-9 shrink-0"><AvatarImage src={member.avatarUrl} alt={member.name} /><AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback></Avatar>
                      <span className="min-w-0 flex-1 truncate">{member.name}</span>
                      {selectedAssigneeId === member.id && <RemixIcon name="check-line" className="text-base" />}
                    </button>)}
                    {candidateMembers.length === 0 && <p className="py-8 text-center text-sm text-text2">{t("taskDetail.noFollowerCandidates")}</p>}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <DropdownMenu><DropdownMenuTrigger className={FIELD}><span className={FIELD_LABEL}><RemixIcon name="flag-line" className="size-4" />{t("ticket.status")}</span><span className="flex items-center gap-2 text-[13px] text-[var(--task-workspace-muted)]"><StatusIcon icon={STATUS_COLUMN_ICON[status]} className="inline-flex !size-4 items-center justify-center leading-none" />{t(STATUSES.find(option => option.value === status)!.label)}</span></DropdownMenuTrigger><DropdownMenuContent align="start" className="w-52 rounded-xl border border-border p-1.5 shadow-none"><DropdownMenuRadioGroup value={status} onValueChange={value => setStatus(value as TicketStatus)}>{STATUSES.map(option => <DropdownMenuRadioItem key={option.value} value={option.value} className="min-h-9 gap-2 rounded-lg px-2"><StatusIcon icon={option.icon} />{t(option.label)}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu>
            <DropdownMenu><DropdownMenuTrigger className={FIELD}><span className={FIELD_LABEL}><RemixIcon name="flag-line" className="size-4" />{t("newTask.priority")}</span><span className="text-[13px] text-[var(--task-workspace-muted)]">{t(PRIORITIES.find(option => option.value === priority)!.label)}</span></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuRadioGroup value={priority} onValueChange={value => setPriority(value as TicketPriority)}>{PRIORITIES.map(option => <DropdownMenuRadioItem key={option.value} value={option.value}>{t(option.label)}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu>
            <DropdownMenu><DropdownMenuTrigger className={FIELD}><span className={FIELD_LABEL}><RemixIcon name="list-check-3" className="size-4" />{t("ticket.permissions")}</span><span className="flex min-w-0 flex-wrap justify-end gap-1 text-xs text-[var(--task-workspace-muted)]">{permissions.length ? permissions.map(value => <span key={value} className="rounded-lg bg-bg2 px-2 py-1">{t(PERMISSIONS.find(option => option.value === value)!.label)}</span>) : <span className="truncate text-[13px]">{t("newTask.unselected")}</span>}</span></DropdownMenuTrigger><DropdownMenuContent>{PERMISSIONS.map(option => <DropdownMenuCheckboxItem key={option.value} checked={permissions.includes(option.value)} onCheckedChange={checked => setPermissions(values => checked ? [...values, option.value] : values.filter(value => value !== option.value))}>{t(option.label)}</DropdownMenuCheckboxItem>)}</DropdownMenuContent></DropdownMenu>
            <DropdownMenu><DropdownMenuTrigger className={FIELD}><span className={FIELD_LABEL}><RemixIcon name="folder-open-line" className="size-4" />{t("taskForm.project")}</span><span className="min-w-0 truncate text-[13px] text-[var(--task-workspace-muted)]">{availableProjects.find(project => project.id === selectedProjectId)?.name ?? t("newTask.unselected")}</span></DropdownMenuTrigger><DropdownMenuContent align="start" className="max-h-72 w-64 overflow-y-auto rounded-xl border border-border p-1.5 shadow-none"><DropdownMenuRadioGroup value={selectedProjectId} onValueChange={value => { setSelectedProjectId(value); if (selectedAssigneeId && !availableProjects.find(project => project.id === value)?.members.some(member => member.id === selectedAssigneeId)) setSelectedAssigneeId("") }}><DropdownMenuRadioItem value="" className="min-h-9 rounded-lg px-2">{t("newTask.unselected")}</DropdownMenuRadioItem>{availableProjects.map(project => <DropdownMenuRadioItem key={project.id} value={project.id} className="min-h-9 rounded-lg px-2">{project.name}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu>
            <DropdownMenu><DropdownMenuTrigger className={FIELD}><span className={FIELD_LABEL}><RemixIcon name="chat-smile-line" className="size-4" />{t("ticket.subject")}</span><span className="text-[13px] text-[var(--task-workspace-muted)]">{t(SUBJECTS.find(option => option.value === subject)!.label)}</span></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuRadioGroup value={subject} onValueChange={value => setSubject(value as TicketSubject)}>{SUBJECTS.map(option => <DropdownMenuRadioItem key={option.value} value={option.value}>{t(option.label)}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu>

          </div>
        </div>
        <Tabs value={tab} onValueChange={value => setTab(value as string)} className="gap-0 lg:hidden"><TabsList variant="line" className="group-data-horizontal/tabs:h-12 w-full justify-start gap-4 border-b border-border bg-[var(--task-workspace-bg)] px-4">{[{value:"details",label:"mobileTask.moreDetails"},{value:"activities",label:"newTask.activities"}].map(item => <TabsTrigger key={item.value} value={item.value} className="h-full flex-none gap-2 text-xs after:rounded-t-[4px] after:bg-[#141a1a] group-data-horizontal/tabs:after:bottom-0 group-data-horizontal/tabs:after:h-[5px]"><RemixIcon name={item.value === "details" ? (tab === item.value ? "file-text-fill" : "file-text-line") : (tab === item.value ? "chat-follow-up-fill" : "chat-follow-up-line")} className="text-base" />{t(item.label as TranslationKey)}</TabsTrigger>)}</TabsList></Tabs>
        <div className={`${tab === "details" ? "flex" : "hidden"} min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 lg:flex lg:px-6`}>
          <textarea aria-label={t("ticket.description")} placeholder={t("ticket.description")} value={description} onChange={event => setDescription(event.target.value)} className="min-h-36 w-full rounded-lg border border-border bg-background p-3 outline-none" />
          <div className="pt-1">
            <button type="button" onClick={() => fileInput.current?.click()} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-text2 hover:bg-bg2"><NewTaskAsset name="attachment2" />{t("taskForm.attachFile")}</button>
            <input ref={fileInput} type="file" multiple className="hidden" onChange={addFiles} />
            {files.length > 0 && <div className="mt-2 flex w-full flex-col gap-2">{files.map(file => <div key={file.id} dir="ltr" className="flex min-h-16 w-full items-center gap-3 rounded-lg border border-[var(--task-workspace-border)] bg-background p-3 text-start">
              <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-md border border-[var(--task-workspace-border)] bg-white">{file.previewUrl ? <Image src={file.previewUrl} alt={file.name} width={40} height={40} unoptimized className="size-full object-cover" /> : <RemixIcon name={file.icon} className="text-xl text-[var(--task-workspace-muted)]" />}</div>
              <span className="min-w-0 flex-1 truncate text-end text-sm text-[var(--task-workspace-text)]" title={file.name}>{file.name}</span>
              <button type="button" aria-label={`${file.name} ×`} onClick={() => removeAttachment(file.id)} className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-[var(--task-workspace-muted)] hover:bg-[var(--task-workspace-soft)]"><RemixIcon name="close-line" className="text-base" /></button>
            </div>)}</div>}
          </div>
        </div>
      </div>
      <div className={`${tab === "activities" ? "flex" : "hidden"} min-h-0 flex-1 flex-col lg:flex lg:border-s lg:border-border`}><NewTaskActivity inline user={user} members={[]} following={following} onFollowingChange={setFollowing} commentStore={commentStore} activityStore={activityStore} canComment={canComment} emojiPicker /></div>
      </div>
    </div>
  </div>
}

export function TicketCreateDialog({ user, onDone, ticket, projectId, projects }: { user: CurrentUser; onDone: () => void; ticket?: LocalTicket; projectId?: string; projects?: TaskFormProjectOption[] }) {
  const t = useT()
  return <DialogContent variant="taskWorkspace" showCloseButton={false} overlayClassName="max-lg:hidden" className="bg-background max-lg:top-0! max-lg:right-0! max-lg:bottom-0! max-lg:left-0! max-lg:w-full! max-lg:max-w-none! max-lg:rounded-none! max-lg:border-0!"><DialogTitle className="sr-only">{t("ticket.title")}</DialogTitle><div className="h-full min-h-0"><TicketWorkspace user={user} onDone={onDone} ticket={ticket} projectId={projectId} projects={projects} /></div></DialogContent>
}

export function TicketCreateForm({ user, projectId, projects = [] }: { user: CurrentUser; projectId?: string; projects?: TaskFormProjectOption[] }) {
  const router = useRouter(), t = useT()
  const [open, setOpen] = useState(true)
  const finish = () => { setOpen(false); router.back() }
  return <Dialog open={open} onOpenChange={value => { if (!value) finish() }}><DialogContent variant="taskWorkspace" showCloseButton={false} overlayClassName="max-lg:hidden" className="max-lg:top-0! max-lg:right-0! max-lg:bottom-0! max-lg:h-dvh! max-lg:w-full! max-lg:max-w-none! max-lg:rounded-none! max-lg:border-0! max-lg:ring-0! lg:top-4 lg:right-4 lg:bottom-4"><DialogTitle className="sr-only">{t("ticket.title")}</DialogTitle><div className="h-full min-h-0"><TicketWorkspace user={user} onDone={finish} projectId={projectId} projects={projects} /></div></DialogContent></Dialog>
}
