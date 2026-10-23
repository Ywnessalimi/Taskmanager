"use client"

import Image from "next/image"
import Link from "next/link"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { RemixIcon } from "@/components/ui/remix-icon"
import type { Organization } from "@/lib/api/types"
import { projectPath } from "@/lib/organization-paths"
import { t, type Locale } from "@/lib/i18n/dictionary"
import { moveDivision, moveProject } from "@/lib/api/organizations"

/** فهرست همهٔ پروژه‌ها در محیط مستقل پروژه‌ها، کنار پروژهٔ انتخاب‌شده. */
export function ProjectNavigator({ organizations, activeId, locale, userId }: { organizations: Organization[]; activeId?: string; locale: Locale; userId: string }) {
  const router = useRouter()
  const [moveError, setMoveError] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const draggedItem = useRef<{ kind: "project"; id: string; organizationId: string } | { kind: "division"; id: string; organizationId: string } | null>(null)
  const activeProject = organizations.flatMap((organization) => organization.projects).find((project) => project.id === activeId)
  const isMyTasks = activeId === "MyTasks"
  const isProjectIndex = !activeId
  const myTasksHref = "/home/projects/MyTasks"

  function canManage(organizationId: string) {
    const organization = organizations.find((entry) => entry.id === organizationId)
    const member = organization?.members.find((entry) => entry.id === userId)
    return member?.role === "owner" || member?.permissions?.editDivision === true || member?.permissions?.editProject === true
  }

  function beginDrag(event: React.DragEvent, item: NonNullable<typeof draggedItem.current>) {
    draggedItem.current = item
    setDraggedItemId(item.id)
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", `${item.kind}:${item.id}`)
    event.dataTransfer.setDragImage(event.currentTarget, event.currentTarget.clientWidth / 2, event.currentTarget.clientHeight / 2)
  }

  async function finishDrop(operation: () => Promise<unknown>) {
    setMoveError(null)
    try {
      await operation()
      router.refresh()
    } catch (cause) {
      setMoveError(cause instanceof Error ? cause.message : t(locale, "projects.moveFailed"))
    } finally {
      draggedItem.current = null
      setDraggedItemId(null)
      setDropTarget(null)
    }
  }

  function onDivisionDragOver(event: React.DragEvent, organizationId: string, divisionId: string) {
    const item = draggedItem.current
    if (!item || !canManage(item.organizationId) || !canManage(organizationId)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
    setDropTarget(`division:${divisionId}`)
  }

  function onDivisionDrop(event: React.DragEvent, organizationId: string, divisionId: string) {
    event.preventDefault()
    event.stopPropagation()
    const item = draggedItem.current
    if (!item || !canManage(item.organizationId) || !canManage(organizationId)) return
    if (item.kind === "project") {
      if (item.id !== divisionId) void finishDrop(() => moveProject(item.id, divisionId))
      else { draggedItem.current = null; setDropTarget(null) }
    } else if (item.id !== divisionId) {
      void finishDrop(() => moveDivision(item.organizationId, item.id, organizationId))
    } else {
      draggedItem.current = null
      setDropTarget(null)
    }
  }

  function onOrganizationDragOver(event: React.DragEvent, organizationId: string) {
    const item = draggedItem.current
    if (item?.kind !== "division" || !canManage(item.organizationId) || !canManage(organizationId)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
    setDropTarget(`organization:${organizationId}`)
  }

  function onOrganizationDrop(event: React.DragEvent, organizationId: string) {
    event.preventDefault()
    event.stopPropagation()
    const item = draggedItem.current
    if (item?.kind !== "division" || !canManage(item.organizationId) || !canManage(organizationId)) return
    if (item.organizationId !== organizationId) void finishDrop(() => moveDivision(item.organizationId, item.id, organizationId))
    else { draggedItem.current = null; setDropTarget(null) }
  }

  function endDrag() {
    draggedItem.current = null
    setDraggedItemId(null)
    setDropTarget(null)
  }

  return (
    <>
    <details className="relative border-b border-border bg-background px-4 py-3 lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-start gap-2 text-sm font-medium"><span>{activeProject?.name ?? (isMyTasks ? t(locale, "nav.myTasks") : isProjectIndex ? t(locale, "miniBar.projects") : t(locale, "projects.companies"))}</span><RemixIcon name="arrow-down-s-line" className="text-lg" /></summary>
      <nav aria-label={t(locale, "projects.all")} className="absolute inset-x-3 top-full z-40 mt-2 max-h-64 overflow-y-auto rounded-xl border border-border bg-background p-2">
        <Link href={myTasksHref} aria-current={isMyTasks ? "page" : undefined} className={`block rounded-md px-3 py-2 text-sm ${isMyTasks ? "bg-bg2 font-semibold" : "hover:bg-bg2"}`}>{t(locale, "nav.myTasks")}</Link>
        <Link href="/projects" className="block rounded-md px-3 py-2 text-sm">{t(locale, "projects.companies")}</Link>
        {organizations.map((organization) => <div key={organization.id} className="py-2">
          <p className="px-3 text-sm font-medium">{organization.name}</p>
          {organization.divisions.map((division) => <div key={division.id} className="ps-3"><p className="px-3 py-1 text-xs text-text3">{division.name}</p>{division.projects.map((project) => <Link key={project.id} href={projectPath({ ...project, organizationSlug: organization.slug })} className="block rounded-md px-3 py-2 text-sm hover:bg-bg2">{project.name}</Link>)}</div>)}
        </div>)}
      </nav>
    </details>
    <aside className="hidden w-52 shrink-0 flex-col border-e border-border bg-[var(--project-surface)] lg:flex">
      <nav className="flex flex-col gap-3 border-b border-border px-4 py-4">
        <Link href={myTasksHref} aria-current={isMyTasks ? "page" : undefined} className={`flex items-center gap-2 px-1 text-xs leading-normal font-medium ${isMyTasks ? "text-foreground" : "text-[#595959] hover:text-foreground"}`}>
          <Image src="/images/figma/project-navigation/tasks.svg" width={16} height={16} alt="" />
          {t(locale, "nav.myTasks")}
        </Link>
      </nav>
      <nav aria-label={t(locale, "projects.all")} className="flex flex-col gap-4 overflow-y-auto p-3">
        {moveError && <p role="alert" className="text-xs text-destructive">{moveError}</p>}
        {organizations.map((organization) => (
          <details key={organization.id} open className="flex flex-col gap-1">
            <summary
              onDragOver={(event) => onOrganizationDragOver(event, organization.id)}
              onDrop={(event) => onOrganizationDrop(event, organization.id)}
              className={`flex cursor-pointer list-none items-center gap-1 rounded-md px-2 py-1 text-base font-medium text-foreground transition-[background-color,outline-color,transform] duration-200 ease-out motion-reduce:transition-none ${dropTarget === `organization:${organization.id}` ? "scale-[1.01] bg-blue-50 outline outline-1 outline-blue-500" : ""}`}
            ><RemixIcon name="arrow-down-s-fill" className="shrink-0 text-base" /><span className="truncate">{organization.name}</span></summary>
            <div className="flex flex-col gap-1">
              {organization.divisions.map((division) => (
                <details key={division.id} open className={`group/navdivision rounded-md ps-2 transition-[background-color,outline-color,transform] duration-200 ease-out motion-reduce:transition-none ${dropTarget === `division:${division.id}` ? "scale-[1.01] bg-blue-50 outline outline-1 outline-blue-500" : ""}`}>
                  <summary
                    draggable={canManage(organization.id)}
                    onDragOver={(event) => onDivisionDragOver(event, organization.id, division.id)}
                    onDrop={(event) => onDivisionDrop(event, organization.id, division.id)}
                    onDragStart={(event) => beginDrag(event, { kind: "division", id: division.id, organizationId: organization.id })}
                    onDragEnd={endDrag}
                    className={`flex min-h-7 cursor-pointer list-none items-center gap-1 rounded-md py-1 text-xs text-text2 transition-opacity duration-150 ${draggedItemId === division.id ? "opacity-45" : ""}`}
                  >
                    <RemixIcon name="arrow-down-s-line" className="shrink-0 text-sm" /><span className="min-w-0 flex-1 truncate">{division.name}</span>
                  </summary>
                  <div className="flex flex-col ps-2">{division.projects.map((project) => (
                    <div key={project.id} className="flex min-h-8 items-center gap-1">
                      <Link href={projectPath({ ...project, organizationSlug: organization.slug })} draggable={canManage(organization.id)} onDragStart={(event) => beginDrag(event, { kind: "project", id: project.id, organizationId: organization.id })} onDragEnd={endDrag} aria-current={project.id === activeId ? "page" : undefined} className={`flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-sm transition-opacity duration-150 ${project.id === activeId ? "bg-background font-semibold text-foreground" : "text-text2 hover:bg-background"} ${draggedItemId === project.id ? "opacity-45" : ""}`}>
                        <RemixIcon name="list-check-2" className="shrink-0 text-base" /><span className="truncate">{project.name}</span>
                      </Link>
                    </div>
                  ))}</div>
                </details>
              ))}
            </div>
          </details>
        ))}
      </nav>
    </aside>
    </>
  )
}
