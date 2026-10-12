"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useT } from "@/components/providers/locale-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { NewTaskButton } from "@/features/tasks/new-task-button"
import { NotificationsPreviewDialog } from "@/features/notifications/notifications-preview-dialog"
import type { CurrentUser, Notification, TaskFormProjectOption } from "@/lib/api/types"

/**
 * هدر دسکتاپ همهٔ مسیرها مطابق KalaMarket node 1710:27098 است. عنوان بر اساس
 * مسیر عوض می‌شود و در صفحهٔ پروژه منوی انتخاب پروژه را نشان می‌دهد.
 */
export function DesktopHeader({
  currentUser,
  notifications,
  projects,
}: {
  currentUser: CurrentUser
  notifications: Notification[]
  projects: TaskFormProjectOption[]
}) {
  const t = useT()
  const pathname = usePathname()
  const router = useRouter()
  const projectId = pathname.match(/^\/home\/projects\/([^/]+)(?:\/|$)/)?.[1]
  const project = projectId ? projects.find((option) => option.id === projectId) : undefined
  const isProject = Boolean(project)
  const sectionTitle = pathname.startsWith("/inbox") ? t("miniBar.inbox") : pathname.startsWith("/messages") ? t("nav.messages") : pathname.startsWith("/tickets") ? t("ticket.title")
    : pathname.startsWith("/account") ? t("nav.account")
    : pathname.startsWith("/notifications") ? t("nav.notifications")
    : pathname.startsWith("/my-tasks") ? t("nav.myTasks")
    : pathname.startsWith("/projects") ? t("projects.all")
    : t("nav.home")

  return (
    <header className="hidden h-14 items-center justify-between border-b border-border bg-background px-4 lg:flex">
      {isProject ? (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex min-w-0 items-center gap-2 text-base text-foreground hover:text-text2" aria-label={t("projects.select")}>
            <Image src="/images/figma/project-header/chevron.svg" alt="" width={20} height={20} />
            <span className="truncate">{project?.name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {projects.map((option) => <DropdownMenuItem key={option.id} onClick={() => router.push(`/home/projects/${option.id}`)}>{option.name}</DropdownMenuItem>)}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <span className="truncate text-base text-foreground">{sectionTitle}</span>
      )}
      <div className="flex shrink-0 items-center gap-3">
        <NewTaskButton figmaStyle user={currentUser} />
        <Image src="/images/figma/project-header/divider.svg" alt="" width={18} height={1} className="rotate-90" />
        <span aria-label={t("nav.search")} className="flex size-8 items-center justify-center text-icon2">
          <Image src="/images/figma/project-header/search.svg" alt="" width={20} height={20} />
        </span>
        <NotificationsPreviewDialog notifications={notifications} projects={projects} iconSrc="/images/figma/project-header/notification.svg" />
        <Link href="/account" aria-label={t("nav.account")}>
          <Avatar>
            {currentUser.avatarUrl && <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />}
            <AvatarFallback>{currentUser.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  )
}
