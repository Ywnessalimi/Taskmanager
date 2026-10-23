"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useT } from "@/components/providers/locale-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DialogTrigger } from "@/components/ui/dialog"
import { DatePickerDialog } from "@/components/ui/date-picker-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PriorityDot } from "@/features/projects/task-display"
import { AssigneePickerDialog } from "./assignee-picker-dialog"
import { RepeatPicker } from "./repeat-picker"
import { TagPickerDialog } from "./tag-picker-dialog"
import { NewTaskAsset, type NewTaskAssetName } from "./new-task-assets"
import { MobileTaskAsset } from "./mobile-task-assets"
import { NewTaskActivity } from "./new-task-activity"
import { WorkspaceActionBar } from "@/components/ui/workspace-action-bar"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useTaskTimer } from "./time-tracking"
import { createTask } from "@/lib/api/tasks"
import type { TaskRecurrence, CurrentUser, TaskFormProjectOption, TaskPriority, TaskStatus } from "@/lib/api/types"
import type { TranslationKey } from "@/lib/i18n/dictionary"

const PRIORITIES: { value: TaskPriority; label: TranslationKey }[] = [{value:"none",label:"priority.none"},{value:"low",label:"priority.low"},{value:"medium",label:"priority.medium"},{value:"high",label:"priority.high"},{value:"urgent",label:"priority.urgent"}]
const FIELD = "flex min-h-6 w-full items-center gap-6 text-start"
function Label({icon,children}:{icon:NewTaskAssetName;children:React.ReactNode}) {
  return <span className="flex w-30 shrink-0 items-center gap-1.5 text-[13px] leading-5 text-[var(--task-workspace-muted)]"><NewTaskAsset name={icon} />{children}</span>
}

/** چیدمان ساخت تسک موبایل 1730:30051 با دادهٔ خالی و کنترل‌های واقعی. */
export function MobileTaskCreateForm({projects, user, defaultProjectId}:{projects:TaskFormProjectOption[];user:CurrentUser;defaultProjectId?:string}) {
  const t=useT(), router=useRouter()
  const [projectId,setProjectId]=useState(projects.some(p=>p.id===defaultProjectId)?defaultProjectId!:projects[0]?.id??"")
  const [title,setTitle]=useState(""), [status,setStatus]=useState<TaskStatus>("todo"), [priority,setPriority]=useState<TaskPriority>("none")
  const [tags,setTags]=useState<string[]>([]), [startDate,setStartDate]=useState(""), [dueDate,setDueDate]=useState("")
  const [assignees,setAssignees]=useState<string[]>([]), [following,setFollowing]=useState(false), [favorite,setFavorite]=useState(false)
  const [minutes,setMinutes]=useState(0), [description,setDescription]=useState(""), [files,setFiles]=useState<string[]>([])
  const [recurrence,setRecurrence]=useState<TaskRecurrence>({dates:[],count:1})
  const [error,setError]=useState(false), [tab,setTab]=useState("activities"), [saving,setSaving]=useState(false)
  const inputFile=useRef<HTMLInputElement>(null), timer=useTaskTimer(minutes,setMinutes)
  const project=projects.find(p=>p.id===projectId), unset=t("newTask.unselected")
  const finish=()=>router.back()
  async function saveTask() {
    if (!title.trim() || !projectId || saving) return
    setSaving(true)
    try {
      await createTask({ recurrence, title: title.trim(), projectId, status, priority, tags, assigneeNames: assignees, startDate: startDate || undefined, dueDate: dueDate || undefined, description: description || undefined, isFavorite: favorite, followers: following ? [user.name] : [], timeSpentMinutes: minutes }, { id: user.id, name: user.name })
      setError(false)
      finish()
    } catch { setError(true) } finally { setSaving(false) }
  }
  return <div className="flex h-dvh flex-col">
    <h1 className="sr-only">{t("taskForm.title")}</h1>
    <div className="mx-auto flex min-h-0 w-full flex-1 flex-col bg-background text-[var(--task-workspace-text)] lg:my-4 lg:h-[calc(100dvh-2rem)] lg:flex-none lg:w-[calc(100%-2rem)] lg:max-w-[1072px] lg:overflow-hidden lg:rounded-2xl lg:border lg:border-border">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <button type="button" aria-label={t("taskForm.cancel")} onClick={finish}><MobileTaskAsset name="back" className="ltr:rotate-180" /></button>
        <div className="flex items-center gap-4">
          <button type="button" disabled aria-label={t("mobileTask.previous")}><MobileTaskAsset name="up" /></button><button type="button" disabled aria-label={t("mobileTask.next")}><MobileTaskAsset name="down" /></button><MobileTaskAsset name="divider" className="rotate-90" />
          <AssigneePickerDialog members={project?.members??[]} assigneeNames={assignees} onChange={setAssignees} trigger={<DialogTrigger aria-label={t("mobileTask.search")}><MobileTaskAsset name="search" /></DialogTrigger>} />
          <DropdownMenu><DropdownMenuTrigger aria-label={t("mobileTask.options")}><MobileTaskAsset name="more" /></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onClick={()=>setTab("details")}>{t("mobileTask.moreDetails")}</DropdownMenuItem><DropdownMenuItem onClick={finish} className="text-destructive">{t("mobileTask.delete")}</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        </div>
      </header>
      {error && <p role="alert" className="shrink-0 px-4 py-2 text-xs text-error">{t("mobileTask.saveError")}</p>}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0">
        <div className="px-4 pt-3 lg:px-6">
          <div className="flex items-center justify-between gap-2">
            <DropdownMenu><DropdownMenuTrigger aria-label={t("taskForm.project")} className="flex min-w-0 items-center gap-1 truncate text-sm text-[var(--task-workspace-muted)]"><span className="truncate">{project?.name??t("taskForm.project")}</span><RemixIcon name="arrow-down-s-line" className="shrink-0 text-sm" /></DropdownMenuTrigger><DropdownMenuContent className="max-h-72 w-80 max-w-[calc(100vw-2rem)] overflow-y-auto"><DropdownMenuRadioGroup value={projectId} onValueChange={value=>{setProjectId(value);setAssignees([])}}>{projects.map(p=><DropdownMenuRadioItem key={p.id} value={p.id} className="min-h-9 whitespace-normal">{p.name}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" disabled className="flex h-8 items-center gap-1 rounded-lg border border-border px-1.5 text-xs text-text2"><NewTaskAsset name="git-merge-line" />{t("newTask.noMilestone")}</button>
              <button type="button" onClick={()=>setFollowing(!following)} aria-pressed={following} className="flex h-8 items-center gap-1 rounded-lg border border-border px-1.5 text-xs text-text2"><NewTaskAsset name="eye-line" />{t(following?"newTask.following":"newTask.follow")}</button>
              <button type="button" aria-label={t("taskDetail.favorite")} aria-pressed={favorite} onClick={()=>setFavorite(!favorite)} className={`flex size-8 items-center justify-center rounded-lg border border-border ${favorite?"bg-bg2":""}`}><NewTaskAsset name="heart3-line" /></button>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-5 pb-6">
            <DropdownMenu><DropdownMenuTrigger aria-label={t("newTask.status")} className="flex items-center gap-1">{status==="completed"?<><MobileTaskAsset name="completed" /><MobileTaskAsset name="status-chevron" /></>:<NewTaskAsset name="frame122" />}</DropdownMenuTrigger><DropdownMenuContent><DropdownMenuRadioGroup value={status} onValueChange={value=>setStatus(value as TaskStatus)}><DropdownMenuRadioItem value="todo">{t("status.todo")}</DropdownMenuRadioItem><DropdownMenuRadioItem value="in-progress">{t("status.inProgress")}</DropdownMenuRadioItem><DropdownMenuRadioItem value="completed">{t("status.completed")}</DropdownMenuRadioItem></DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu>
            <MobileTaskAsset name="status-divider" className="rotate-90" /><input required autoFocus aria-label={t("taskForm.titlePlaceholder")} placeholder={t("taskForm.titlePlaceholder")} value={title} onChange={e=>setTitle(e.target.value)} className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none placeholder:text-text3" />
          </div>
          <div className="grid grid-cols-1 gap-4 pb-6 lg:grid-cols-2 lg:gap-x-6">
            <DropdownMenu><DropdownMenuTrigger className={FIELD}><Label icon="flag-line">{t("newTask.priority")}</Label><span className="flex items-center gap-1 text-xs">{priority==="urgent"?<MobileTaskAsset name="urgent" />:priority!=="none"?<PriorityDot priority={priority} />:null}{priority==="none"?unset:t(PRIORITIES.find(p=>p.value===priority)!.label)}</span></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuRadioGroup value={priority} onValueChange={value=>setPriority(value as TaskPriority)}>{PRIORITIES.map(p=><DropdownMenuRadioItem key={p.value} value={p.value}><PriorityDot priority={p.value} />{t(p.label)}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu>
            <TagPickerDialog tags={tags} onChange={setTags} trigger={<DialogTrigger className={FIELD}><Label icon="price-tag3-line">{t("newTask.tags")}</Label><span className="flex min-w-0 flex-wrap gap-1 text-xs">{tags.length?tags.slice(0,2).map(tag=><span key={tag} className="rounded-lg bg-[var(--project-filter-bg)] px-1 py-1 text-[var(--project-filter-fg)]">{tag}</span>):unset}{tags.length>2&&<span className="rounded-lg bg-bg3 px-1 py-1">+{tags.length-2}</span>}</span></DialogTrigger>} />
            <div className={`${FIELD} flex-wrap gap-x-3 gap-y-2`}>
              <Label icon="timer-line">{t("newTask.timeSpent")}</Label>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <input aria-label={t("newTask.timeSpent")} type="number" min={0} step={1} value={minutes + Math.floor(timer.elapsedSeconds / 60)} onChange={event => setMinutes(Math.max(0, Math.floor(Number(event.target.value) || 0) - Math.floor(timer.elapsedSeconds / 60)))} className="h-8 w-16 rounded-md border border-border bg-transparent px-2 text-center text-xs" />
                <span className="text-xs text-text3">{t("newTask.minutesUnit")}</span>
                <button type="button" onClick={() => setMinutes(value => value + 10)} className="h-8 rounded-md border border-border px-2 text-xs">{t("newTask.add10Minutes")}</button>
                <button type="button" onClick={() => setMinutes(value => value + 30)} className="h-8 rounded-md border border-border px-2 text-xs">{t("newTask.add30Minutes")}</button>
                <button type="button" aria-label={t(timer.running?"taskDetail.stopTimer":"taskDetail.startTimer")} aria-pressed={timer.running} onClick={timer.toggle} className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border"><MobileTaskAsset name="play" /></button>
              </div>
            </div>
            <DatePickerDialog value={startDate} onChange={setStartDate} trigger={<DialogTrigger className={FIELD}><Label icon="calendar-todo-line">{t("newTask.startDate")}</Label><span className="flex items-center gap-1 text-[13px]">{startDate&&<MobileTaskAsset name="start-calendar" />}{startDate||unset}</span></DialogTrigger>} />
            <DatePickerDialog value={dueDate} onChange={setDueDate} trigger={<DialogTrigger className={FIELD}><Label icon="calendar-check-line">{t("newTask.dueDate")}</Label><span className="flex items-center gap-1 text-[13px]">{dueDate&&<MobileTaskAsset name="due-calendar" />}{dueDate||unset}</span></DialogTrigger>} />
            <AssigneePickerDialog members={project?.members??[]} assigneeNames={assignees} onChange={setAssignees} trigger={<DialogTrigger className={FIELD}><Label icon="team-line">{t("newTask.members")}</Label><span className="flex -space-x-2 rtl:space-x-reverse">{assignees.length?assignees.map(name=><Avatar key={name} className="size-6 border-2 border-background"><AvatarImage src={project?.members.find(p=>p.name===name)?.avatarUrl} alt={name} /><AvatarFallback>{name.slice(0,1)}</AvatarFallback></Avatar>):<span className="text-[13px]">{unset}</span>}</span></DialogTrigger>} />
            <RepeatPicker value={recurrence} onChange={setRecurrence} />
          </div>
        </div>
        <Tabs value={tab} onValueChange={value=>setTab(value as string)} className="gap-0 lg:hidden">
          <TabsList variant="line" className="group-data-horizontal/tabs:h-12 w-full justify-start gap-4 rounded-none border-b border-border bg-[var(--task-workspace-bg)] px-4">
            <TabsTrigger value="details" className="h-full flex-none gap-2 text-xs after:rounded-t-[4px] after:bg-[#141a1a] group-data-horizontal/tabs:after:bottom-0 group-data-horizontal/tabs:after:h-[5px]"><MobileTaskAsset name="details" />{t("mobileTask.moreDetails")}</TabsTrigger>
            <TabsTrigger value="activities" className="h-full flex-none gap-2 text-xs after:rounded-t-[4px] after:bg-[#141a1a] group-data-horizontal/tabs:after:bottom-0 group-data-horizontal/tabs:after:h-[5px]"><MobileTaskAsset name="activities" />{t("newTask.activities")}</TabsTrigger>
          </TabsList>
        </Tabs>
<div className={`${tab === "details" ? "flex" : "hidden"} flex-col gap-4 p-4 lg:flex lg:px-6`}><textarea value={description} onChange={e=>setDescription(e.target.value)} aria-label={t("taskForm.descriptionPlaceholder")} placeholder={t("taskForm.descriptionPlaceholder")} className="min-h-36 w-full rounded-lg border border-border bg-background p-3 outline-none" /><button type="button" onClick={()=>inputFile.current?.click()} className="flex items-center gap-2 text-sm text-text2"><NewTaskAsset name="attachment2" />{t("taskForm.attachFile")}</button><input ref={inputFile} type="file" multiple className="hidden" onChange={e=>setFiles(Array.from(e.target.files??[]).map(file=>file.name))} />{files.map(file=><button key={file} type="button" onClick={()=>setFiles(list=>list.filter(name=>name!==file))} className="w-fit rounded bg-bg2 px-2 py-1 text-xs">{file} ×</button>)}</div>
        </div>
        <div className={`${tab === "activities" ? "flex" : "hidden"} min-h-0 w-full flex-1 flex-col`}>
<div className="flex min-h-0 w-full flex-1 flex-col"><NewTaskActivity inline user={user} members={project?.members??[]} following={following} onFollowingChange={setFollowing} /></div>
        </div>
      </div>
    </div>
    <WorkspaceActionBar onSave={saveTask} onCancel={finish} saveDisabled={!title.trim() || !projectId} saving={saving} />
  </div>
}
