"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverClose, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useT } from "@/components/providers/locale-provider"
import { STATUS_KEY, VERB_KEY, formatRelativeTime, targetHref } from "./notification-format"
import type { Notification, TaskFormProjectOption } from "@/lib/api/types"

/** پیش‌نمایش Figma 1723:29972، با فیلتر پروژه و خواندن محلی اعلان‌ها. */
export function NotificationsPreviewDialog({ notifications, projects = [], iconSrc }: { notifications: Notification[]; projects?: TaskFormProjectOption[]; iconSrc?: string }) {
  const t = useT()
  const [readIds, setReadIds] = useState<string[]>([])
  const [filter, setFilter] = useState("all")
  const projectOf = (n: Notification) => n.target.type === "task" ? n.target.projectId : n.target.type === "project" ? n.target.id : undefined
  const groups = projects.filter((project) => notifications.some((n) => projectOf(n) === project.id))
  const visible = notifications.filter((n) => filter === "all" || projectOf(n) === filter)
  const isUnread = (n: Notification) => n.status === "unread" && !readIds.includes(n.id)

  return (
    <Popover>
      <PopoverTrigger aria-label={t("nav.notifications")} className="relative flex size-8 items-center justify-center rounded-md text-icon2 hover:bg-bg2 hover:text-icon">
        {iconSrc ? <Image src={iconSrc} alt="" width={20} height={20} /> : <RemixIcon name="notification-3-line" className="text-lg" />}
        {notifications.some(isUnread) && <span className="absolute end-1.5 top-1.5 size-1.5 rounded-full bg-brand" />}
      </PopoverTrigger>
      <PopoverContent className="flex w-[393px] max-w-[calc(100vw-2rem)] flex-col gap-[11px] overflow-hidden rounded-2xl bg-background pt-4 shadow-none ring-1 ring-border">
        <PopoverTitle className="px-4 text-start text-base font-semibold leading-5">{t("notifications.title")}</PopoverTitle>
        <Tabs value={filter} onValueChange={(value) => setFilter(value as string)} className="gap-0">
          <div className="flex h-12 items-center gap-4 border-y border-border px-4">
            <TabsList variant="line" className="h-full min-w-0 flex-1 justify-start gap-4 overflow-x-auto p-0 [scrollbar-width:none]">
              {[{ id: "all", name: t("notifications.viewAll") }, ...groups.map((project) => ({ id: project.id, name: project.name }))].map((group) => (
                <TabsTrigger key={group.id} value={group.id} className="h-full flex-none rounded-none border-0 px-0 text-xs after:rounded-t-[4px] after:bg-[#141a1a] group-data-horizontal/tabs:after:bottom-0 group-data-horizontal/tabs:after:h-[5px]">{group.name}</TabsTrigger>
              ))}
            </TabsList>
            <PopoverClose nativeButton={false} render={<Link href="/account" aria-label={t("account.sectionNotifications")} className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-bg2" />}>
              <Image src="/images/figma/notifications/settings.svg" alt="" width={20} height={20} />
            </PopoverClose>
          </div>
          <TabsContent value={filter} className="max-h-[min(480px,60vh)] overflow-y-auto px-4 pb-4">
            {visible.map((notification, index) => {
              const project = projects.find((option) => option.id === projectOf(notification))
              const member = projects.flatMap((option) => option.members).find((person) => person.name === notification.actorName)
              return (
                <PopoverClose key={notification.id} nativeButton={false} render={<Link href={targetHref(notification.target)} onClick={() => setReadIds((ids) => [...ids, notification.id])} className={`flex min-h-16 w-full items-center gap-4 py-2 text-start hover:bg-bg2 ${index < visible.length - 1 ? "border-b border-border" : ""}`} />}>
                  <Avatar className="size-8 shrink-0"><AvatarImage src={member?.avatarUrl} /><AvatarFallback>{notification.actorName?.slice(0, 1) ?? "?"}</AvatarFallback></Avatar>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <p className="text-sm leading-5 text-foreground"><span className="font-semibold">{notification.actorName}</span> {t(VERB_KEY[notification.verb])}{notification.verb === "taskStatusChanged" && notification.verbStatus && <> {t(STATUS_KEY[notification.verbStatus])}</>} <span className="font-semibold">{notification.target.label}</span></p>
                    <p className="flex flex-wrap items-center gap-2 text-sm leading-5 text-text3"><span>{formatRelativeTime(t, notification.createdAt)}</span><Image src="/images/figma/notifications/separator.svg" alt="" width={4} height={4} /><span>{project?.name ?? notification.target.label}</span></p>
                  </div>
                  <span className="flex w-7 shrink-0 justify-center">{isUnread(notification) && <Image src="/images/figma/notifications/unread.svg" alt="" width={12} height={12} />}</span>
                </PopoverClose>
              )
            })}
            {visible.length === 0 && <p className="py-6 text-center text-sm text-text2">{t("notifications.empty")}</p>}
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
