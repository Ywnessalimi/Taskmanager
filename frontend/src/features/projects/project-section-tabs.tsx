"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { useT } from "@/components/providers/locale-provider"
import { RemixIcon } from "@/components/ui/remix-icon"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChatPage } from "@/features/pages/chat-page"
import { DocumentPage } from "@/features/pages/document-page"
import { TaskPanel } from "@/features/tasks/task-panel"
import type { Member, Project, Task } from "@/lib/api/types"
import type { TranslationKey } from "@/lib/i18n/dictionary"
import { ProjectOverview } from "./project-overview"
import { ProjectTaskList } from "./project-task-list"
import type { TaskViewId } from "./view-switcher"
import { getProjectChatMessages, getProjectPages, saveProjectPage } from "@/lib/api/project-pages"

type CustomPageKind = "document" | "chat"
type CustomPage = { id: string; kind: CustomPageKind; title: string; content: string; unreadCount?: number }

const VIEW_TABS: { id: TaskViewId; labelKey: TranslationKey; asset?: string }[] = [
  { id: "board", labelKey: "view.board", asset: "board.svg" },
  { id: "tree", labelKey: "projectTabs.list", asset: "list.svg" },
  { id: "calendar", labelKey: "view.calendar", asset: "calendar.svg" },
  { id: "timeline", labelKey: "view.timeline", asset: "gantt.svg" },
]

const TAB_CLASS = "h-auto flex-none gap-1 rounded-lg px-2 py-1 text-sm font-medium text-text3 data-active:text-foreground after:bg-[#141a1a] after:rounded-t-[4px] group-data-horizontal/tabs:after:bottom-[-11px] group-data-horizontal/tabs:after:h-[5px]"

function DesignAsset({ name, size }: { name: string; size: 16 | 20 }) {
  return <Image src={`/images/figma/project-tabs/${name}`} alt="" width={size} height={size} className="shrink-0" />
}

function Divider() {
  return <Image src="/images/figma/project-tabs/divider.svg" alt="" width={14} height={1} className="mx-1 shrink-0 rotate-90" />
}

/** نوار یکپارچهٔ پروژه و MyTasks مطابق فریم 1710:27099؛ صفحات افزوده‌شده و پنل تسک را حفظ می‌کند. */
export function ProjectSectionTabs({
  project,
  tasks = project?.tasks ?? [],
  overviewContent,
  today,
  currentUserName,
  ticketAssignees,
}: {
  project?: Project
  tasks?: Task[]
  overviewContent?: ReactNode
  today: string
  currentUserName: string
  ticketAssignees?: Member[]
}) {
  const [value, setValue] = useState<string>("board")
  const [pages, setPages] = useState<CustomPage[]>([])
  const [pagesLoaded, setPagesLoaded] = useState(!project)
  const nextId = useRef(1)
  const creatingKinds = useRef(new Set<CustomPageKind>())
  const t = useT()

  useEffect(() => {
    if (!project) { setPages([]); setPagesLoaded(true); return }
    let active = true
    setPagesLoaded(false)
    getProjectPages(project.id).then((saved) => {
      if (!active) return
      setPages(saved.map((page) => ({ id: page.id, kind: page.kind, title: page.title, content: page.content, unreadCount: 0 })))
      setPagesLoaded(true)
    }).catch(() => { if (active) setPagesLoaded(true) })
    return () => { active = false }
  }, [project?.id])

  useEffect(() => {
    if (!project || !pagesLoaded) return
    const documents = pages.filter((page) => page.kind === "document")
    if (!documents.length) return
    const timeout = window.setTimeout(() => {
      for (const page of documents) void saveProjectPage(project.id, "document", { title: page.title.trim() || t("tabs.newDocument"), content: page.content }).catch(() => undefined)
    }, 500)
    return () => window.clearTimeout(timeout)
  }, [pages, pagesLoaded, project?.id, t])

  const chatPage = pages.find((page) => page.kind === "chat")
  useEffect(() => {
    if (!project || !chatPage) return
    let active = true
    const readKey = `quire:project-chat-read:${project.id}`
    const refresh = async () => {
      try {
        const messages = await getProjectChatMessages(project.id)
        if (!active) return
        const latestId = messages.at(-1)?.id ?? ""
        const savedReadId = localStorage.getItem(readKey)
        if (!savedReadId || value === chatPage.id) {
          if (latestId) localStorage.setItem(readKey, latestId)
          setPages((current) => current.map((page) => page.id === chatPage.id ? { ...page, unreadCount: 0 } : page))
          return
        }
        const readIndex = messages.findIndex((message) => message.id === savedReadId)
        const unread = messages.slice(readIndex + 1).filter((message) => message.authorName !== currentUserName).length
        setPages((current) => current.map((page) => page.id === chatPage.id ? { ...page, unreadCount: unread } : page))
      } catch { /* Keep the last known count if the local API is unavailable. */ }
    }
    void refresh()
    const interval = window.setInterval(refresh, 5000)
    return () => { active = false; window.clearInterval(interval) }
  }, [project?.id, chatPage?.id, value, currentUserName])

  async function addPage(kind: CustomPageKind) {
    if (pages.some((page) => page.kind === kind) || creatingKinds.current.has(kind)) return
    creatingKinds.current.add(kind)
    const title = kind === "document" ? t("tabs.newDocument") : t("tabs.chat")
    let page: CustomPage = { id: `${kind}-${nextId.current++}`, kind, title, content: "", unreadCount: 0 }
    try {
      if (project) {
        const saved = await saveProjectPage(project.id, kind, { title, content: "" })
        page = { id: saved.id, kind, title: saved.title, content: saved.content, unreadCount: 0 }
      }
      setPages((previous) => [...previous, page])
      setValue(page.id)
    } catch {
      return
    } finally {
      creatingKinds.current.delete(kind)
    }
  }

  function updateDocument(pageId: string, title: string, content: string) {
    setPages((previous) => previous.map((page) => page.id === pageId ? { ...page, title: title || t("tabs.newDocument"), content } : page))
  }

  return (
    <div className="flex min-h-0 flex-1 items-stretch">
      <TaskPanel />
      <Tabs value={value} onValueChange={(next) => setValue(next as string)} className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TabsList variant="line" className="group-data-horizontal/tabs:h-12 w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-border bg-[var(--project-surface)] px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsTrigger value="overview" className={TAB_CLASS}>
            <DesignAsset name="dashboard.svg" size={20} />
            {t("projectTabs.dashboard")}
          </TabsTrigger>
          <Divider />
          {VIEW_TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className={TAB_CLASS}>
              {tab.asset && <DesignAsset name={tab.asset} size={16} />}
              {t(tab.labelKey)}
            </TabsTrigger>
          ))}
          <Divider />
          {pages.map((page) => (
            <TabsTrigger key={page.id} value={page.id} className={`${TAB_CLASS} relative min-w-0 max-w-36 truncate`}>
              <span className="truncate">{page.title || t("tabs.newDocument")}</span>
              {!!page.unreadCount && <span className="absolute -top-1 -end-1 flex min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] leading-4 text-white">{page.unreadCount > 99 ? "99+" : page.unreadCount}</span>}
            </TabsTrigger>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger aria-label={t("tabs.addPage")} className="flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-sm text-text3 hover:text-foreground">
              <DesignAsset name="add.svg" size={20} />
              {t("projectTabs.add")}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem disabled={pages.some((page) => page.kind === "document")} onClick={() => void addPage("document")}><RemixIcon name="file-text-line" className="text-base" />{t("tabs.document")}</DropdownMenuItem>
              <DropdownMenuItem disabled={pages.some((page) => page.kind === "chat")} onClick={() => void addPage("chat")}><RemixIcon name="chat-3-line" className="text-base" />{t("tabs.chat")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {project && <Link href={`/home/projects/${project.id}/settings`} className="flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-sm text-text3 hover:bg-bg2 hover:text-foreground">
            <RemixIcon name="settings-3-fill" className="text-base" />{t("project.settings")}
          </Link>}
        </TabsList>

        <TabsContent value="overview" className="p-4">
          {overviewContent ?? (project ? <ProjectOverview project={project} /> : null)}
        </TabsContent>
        {VIEW_TABS.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="min-w-0 p-4">
            <ProjectTaskList project={project} tasks={tasks} today={today} view={tab.id} ticketAssignees={ticketAssignees} />
          </TabsContent>
        ))}
        {pages.map((page) => (
          <TabsContent key={page.id} value={page.id} className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4">
            {page.kind === "document" ? <DocumentPage title={page.title} content={page.content} onChange={(title, content) => updateDocument(page.id, title, content)} /> : <ChatPage currentUserName={currentUserName} projectId={project?.id} />}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
