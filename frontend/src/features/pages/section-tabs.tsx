"use client"

import { useRef, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RemixIcon } from "@/components/ui/remix-icon"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useT } from "@/components/providers/locale-provider"
import { useTaskPanel } from "@/components/providers/task-panel-provider"
import { TaskPanel } from "@/features/tasks/task-panel"
import type { TranslationKey } from "@/lib/i18n/dictionary"
import { ChatPage } from "./chat-page"
import { DocumentPage } from "./document-page"

export type CustomPageKind = "document" | "chat"

type CustomPage = {
  id: string
  kind: CustomPageKind
  title: string
}

const PAGE_KINDS: {
  kind: CustomPageKind
  icon: string
  labelKey: TranslationKey
  titleKey: TranslationKey
}[] = [
  { kind: "document", icon: "file-text-line", labelKey: "tabs.document", titleKey: "tabs.newDocument" },
  { kind: "chat", icon: "chat-3-line", labelKey: "tabs.chat", titleKey: "tabs.chat" },
]

const TRIGGER_CLASS =
  "flex-none px-1 text-text2 data-active:text-brand after:bg-brand hover:text-foreground"

/**
 * نوار تب اصلی صفحه (لیست / نمای‌کلی + صفحه‌های افزوده‌شده).
 *
 * پس‌زمینه‌ی روشن (`bg-background`)، یک بوردر کم‌رنگ زیر کل نوار، و تب فعال به رنگ برند —
 * تنها جای استفاده از رنگ برند در این نوار، همان تب انتخاب‌شده است (طبق docs/DESIGN.md).
 * دکمه‌ی «+» انتهای نوار یک منو باز می‌کند که با آن می‌شود صفحه‌ی «سند» یا «چت» اضافه کرد.
 *
 * وقتی پنل تسک باز است (`TaskPanelProvider`)، این کامپوننت یک ردیف flex می‌شود: `TaskPanel`
 * در سمت شروع (راست در RTL) و خودِ تب‌ها کنارش جمع می‌شوند — پنل عمداً مودال روی کل صفحه
 * نیست. زیر breakpoint `lg` جا برای دو ستون نیست، پس آنجا فقط پنل نشان داده می‌شود.
 */
export function SectionTabs({
  listContent,
  overviewContent,
  currentUserName,
}: {
  listContent: React.ReactNode
  overviewContent: React.ReactNode
  currentUserName: string
}) {
  const [pages, setPages] = useState<CustomPage[]>([])
  const [value, setValue] = useState("list")
  /** شمارنده‌ی محلی برای شناسه‌ی صفحه‌ها؛ عمداً Date.now نیست تا رندر خالص بماند. */
  const nextId = useRef(1)
  const t = useT()
  const panelOpen = Boolean(useTaskPanel()?.panel)

  function addPage(kind: CustomPageKind) {
    const meta = PAGE_KINDS.find((item) => item.kind === kind)!
    const sameKindCount = pages.filter((page) => page.kind === kind).length
    const title = t(meta.titleKey)
    const page: CustomPage = {
      id: `${kind}-${nextId.current++}`,
      kind,
      title: sameKindCount === 0 ? title : `${title} ${sameKindCount + 1}`,
    }
    setPages((prev) => [...prev, page])
    setValue(page.id)
  }

  return (
    <div className="flex min-h-0 flex-1 items-stretch">
      <TaskPanel />

      <Tabs
        value={value}
        onValueChange={(next) => setValue(next as string)}
        className={panelOpen ? "hidden min-w-0 flex-1 lg:flex" : "min-w-0 flex-1"}
      >
      <TabsList
        variant="line"
        className="group-data-horizontal/tabs:h-8 w-full justify-start gap-1 rounded-none border-b border-border bg-background px-4"
      >
        <TabsTrigger value="list" className={TRIGGER_CLASS}>
          {t("tabs.list")}
        </TabsTrigger>
        <TabsTrigger value="overview" className={TRIGGER_CLASS}>
          {t("tabs.overview")}
        </TabsTrigger>

        {pages.map((page) => (
          <TabsTrigger key={page.id} value={page.id} className={TRIGGER_CLASS}>
            <RemixIcon
              name={page.kind === "document" ? "file-text-line" : "chat-3-line"}
              className="text-sm"
            />
            {page.title}
          </TabsTrigger>
        ))}

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t("tabs.addPage")}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-icon2 hover:bg-bg2 hover:text-icon"
          >
            <RemixIcon name="add-line" className="text-base" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {PAGE_KINDS.map((item) => (
              <DropdownMenuItem key={item.kind} onClick={() => addPage(item.kind)}>
                <RemixIcon name={item.icon} className="text-base" />
                {t(item.labelKey)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TabsList>

      <TabsContent value="list" className="p-4">
        {listContent}
      </TabsContent>
      <TabsContent value="overview" className="p-4">
        {overviewContent}
      </TabsContent>

        {pages.map((page) => (
          <TabsContent key={page.id} value={page.id} className="p-4">
            {page.kind === "document" ? (
              <DocumentPage title={page.title} />
            ) : (
              <ChatPage currentUserName={currentUserName} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
