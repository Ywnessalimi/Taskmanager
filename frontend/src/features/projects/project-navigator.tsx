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
import { ProjectEntityCreateDialog, type ProjectEntityCreateTarget } from "./project-entity-create-dialog"

/** فهرست همهٔ پروژه‌ها در محیط مستقل پروژه‌ها، کنار پروژهٔ انتخاب‌شده. */
export function ProjectNavigator({ organizations, activeId, locale, userId }: { organizations: Organization[]; activeId?: string; locale: Locale; userId: string }) {
  const router = useRouter()
  const [moveError, setMoveError] = useState<string | null>(null)
  const [createTarget, setCreateTarget] = useState<ProjectEntityCreateTarget | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const draggedItem = useRef<{ kind: "project"; id: string; organizationId: string } | { kind: "division"; id: string; organizationId: string } | null>(null)
  const isMyTasks = activeId === "MyTasks"
  const myTasksHref = "/home/projects/MyTasks"

  function canManage(organizationId: string) {
    const organization = organizations.find((entry) => entry.id === organizationId)
    const member = organization?.members.find((entry) => entry.id === userId)
    return member?.role === "owner" || member?.permissions?.editDivision === true || member?.permissions?.editProject === true
  }

  function hasPermission(organizationId: string, permission: "createDivision" | "createProject") {
    const organization = organizations.find((entry) => entry.id === organizationId)
    const member = organization?.members.find((entry) => entry.id === userId)
    if (member?.role === "owner") return true
    return member?.permissions?.[permission] === true
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
    <aside className="hidden w-52 shrink-0 flex-col border-e border-border bg-[var(--project-surface)] lg:flex">
      <nav className="flex flex-col gap-3 border-b border-border px-4 py-4">
        <a href={myTasksHref} aria-current={isMyTasks ? "page" : undefined} className={`flex items-center gap-2 px-1 text-xs leading-normal font-medium ${isMyTasks ? "text-foreground" : "text-[#595959] hover:text-foreground"}`}>
          <Image src="/images/figma/project-navigation/tasks.svg" width={16} height={16} alt="" />
          {t(locale, "nav.myTasks")}
        </a>
        <button type="button" onClick={() => setCreateTarget({ kind: "organization" })} className="flex min-h-8 items-center gap-2 rounded-md px-1 text-start text-xs leading-normal text-text2 hover:bg-bg2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
          <RemixIcon name="add-line" className="shrink-0 text-base" />
          {t(locale, "projects.createOrganization")}
        </button>
      </nav>
      <nav aria-label={t(locale, "projects.all")} className="flex flex-col gap-4 overflow-y-auto p-3">
        {moveError && <p role="alert" className="text-xs text-destructive">{moveError}</p>}
        {organizations.map((organization) => {
          const canAddDivision = hasPermission(organization.id, "createDivision")
          return <details key={organization.id} open className="group/navorg relative flex flex-col gap-1">
            <summary
              onDragOver={(event) => onOrganizationDragOver(event, organization.id)}
              onDrop={(event) => onOrganizationDrop(event, organization.id)}
              className={`flex cursor-pointer list-none items-center gap-1 rounded-md py-1 ${canAddDivision ? "pe-8" : "px-2"} text-base font-medium text-foreground transition-[background-color,outline-color,transform] duration-200 ease-out motion-reduce:transition-none ${dropTarget === `organization:${organization.id}` ? "scale-[1.01] bg-blue-50 outline outline-1 outline-blue-500" : ""}`}
            ><RemixIcon name="arrow-down-s-fill" className="shrink-0 text-base" /><Image src={organization.imageUrl || "/images/divisions/general.jpg"} alt="" width={22} height={22} unoptimized className="size-[22px] shrink-0 rounded-md object-cover" /><span className="truncate">{organization.name}</span></summary>
            {canAddDivision && <button type="button" aria-label={`${t(locale, "projects.addDivision")} — ${organization.name}`} title={t(locale, "projects.addDivision")} onClick={() => setCreateTarget({ kind: "division", organizationId: organization.id })} className="absolute end-2 top-1 grid size-6 place-items-center rounded text-icon2 opacity-0 transition-opacity hover:bg-bg2 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-ring group-hover/navorg:opacity-100 group-focus-within/navorg:opacity-100"><RemixIcon name="add-line" className="text-base" /></button>}
            <div className="flex flex-col gap-1">
              {organization.divisions.map((division) => {
                const canAddProject = hasPermission(organization.id, "createProject")
                return (
                <details key={division.id} open className={`group/navdivision relative rounded-md ps-2 transition-[background-color,outline-color,transform] duration-200 ease-out motion-reduce:transition-none ${dropTarget === `division:${division.id}` ? "scale-[1.01] bg-blue-50 outline outline-1 outline-blue-500" : ""}`}>
                  <summary
                    draggable={canManage(organization.id)}
                    onDragOver={(event) => onDivisionDragOver(event, organization.id, division.id)}
                    onDrop={(event) => onDivisionDrop(event, organization.id, division.id)}
                    onDragStart={(event) => beginDrag(event, { kind: "division", id: division.id, organizationId: organization.id })}
                    onDragEnd={endDrag}
                    className={`flex min-h-7 cursor-pointer list-none items-center gap-1 rounded-md py-1 ${canAddProject ? "pe-7" : "pe-1"} text-xs text-text2 transition-opacity duration-150 ${draggedItemId === division.id ? "opacity-45" : ""}`}
                  >
                    <RemixIcon name="arrow-down-s-line" className="shrink-0 text-sm" /><RemixIcon name="folder-line" className="shrink-0 text-base" /><span className="min-w-0 flex-1 truncate">{division.name}</span>
                  </summary>
                  {canAddProject && <button type="button" draggable={false} aria-label={`${t(locale, "projects.addProject")} — ${division.name}`} title={t(locale, "projects.addProject")} onClick={() => setCreateTarget({ kind: "project", organizationId: organization.id, divisionId: division.id })} className="absolute end-1 top-0 grid size-6 place-items-center rounded text-icon2 opacity-0 transition-opacity hover:bg-bg2 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-ring group-hover/navdivision:opacity-100 group-focus-within/navdivision:opacity-100"><RemixIcon name="add-line" className="text-base" /></button>}
                  <div className="flex flex-col ps-2">{division.projects.map((project) => (
                    <div key={project.id} className="flex min-h-8 items-center gap-1">
                      <Link href={projectPath({ ...project, organizationSlug: organization.slug })} draggable={canManage(organization.id)} onDragStart={(event) => beginDrag(event, { kind: "project", id: project.id, organizationId: organization.id })} onDragEnd={endDrag} aria-current={project.id === activeId ? "page" : undefined} className={`flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-sm transition-opacity duration-150 ${project.id === activeId ? "bg-background font-semibold text-foreground" : "text-text2 hover:bg-background"} ${draggedItemId === project.id ? "opacity-45" : ""}`}>
                        <RemixIcon name="list-check-2" className="shrink-0 text-base" /><span className="truncate">{project.name}</span>
                      </Link>
                    </div>
                  ))}</div>
                </details>
                )
              })}
            </div>
          </details>
        })}
      </nav>
    </aside>
    <ProjectEntityCreateDialog target={createTarget} onClose={() => setCreateTarget(null)} />
    </>
  )
}
