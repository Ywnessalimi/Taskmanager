"use client"

import Image from "next/image"
import { useRef, useState } from "react"
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

type CustomPageKind = "document" | "chat"
type CustomPage = { id: string; kind: CustomPageKind; title: string }

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
  const nextId = useRef(1)
  const t = useT()

  function addPage(kind: CustomPageKind) {
    const sameKindCount = pages.filter((page) => page.kind === kind).length
    const title = kind === "document" ? t("tabs.newDocument") : t("tabs.chat")
    const page = { id: `${kind}-${nextId.current++}`, kind, title: sameKindCount ? `${title} ${sameKindCount + 1}` : title }
    setPages((previous) => [...previous, page])
    setValue(page.id)
  }

  return (
    <div className="flex min-h-0 flex-1 items-stretch">
      <TaskPanel />
      <Tabs value={value} onValueChange={(next) => setValue(next as string)} className="min-w-0 flex-1">
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
            <TabsTrigger key={page.id} value={page.id} className={TAB_CLASS}>{page.title}</TabsTrigger>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger aria-label={t("tabs.addPage")} className="flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-sm text-text3 hover:text-foreground">
              <DesignAsset name="add.svg" size={20} />
              {t("projectTabs.add")}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => addPage("document")}><RemixIcon name="file-text-line" className="text-base" />{t("tabs.document")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => addPage("chat")}><RemixIcon name="chat-3-line" className="text-base" />{t("tabs.chat")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          <TabsContent key={page.id} value={page.id} className="p-4">
            {page.kind === "document" ? <DocumentPage title={page.title} /> : <ChatPage currentUserName={currentUserName} />}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
