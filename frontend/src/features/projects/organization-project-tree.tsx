"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useLocale, useT } from "@/components/providers/locale-provider"
import { organizationPath, projectPath } from "@/lib/organization-paths"
import { moveDivision, moveProject } from "@/lib/api/organizations"
import type { CurrentUser, Organization } from "@/lib/api/types"
import { ProjectEntityCreateDialog, type ProjectEntityCreateTarget } from "./project-entity-create-dialog"

function toggle(set: Set<string>, id: string) {
  const next = new Set(set)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

export function OrganizationProjectTree({ organizations, user }: { organizations: Organization[]; user: CurrentUser }) {
  const t = useT()
  const { locale } = useLocale()
  const collapsedChevronDirection = locale === "fa" ? "rotate-90" : "-rotate-90"
  const router = useRouter()
  const [openOrganizations, setOpenOrganizations] = useState(() => new Set<string>())
  const [openDivisions, setOpenDivisions] = useState(() => new Set<string>())
  const [treeStateLoaded, setTreeStateLoaded] = useState(false)
  const treeStateKey = `quire:projects-tree:${user.id}`
  const [createTarget, setCreateTarget] = useState<ProjectEntityCreateTarget | null>(null)
  const [moveError, setMoveError] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const draggedItem = useRef<{ kind: "project"; id: string; organizationId: string } | { kind: "division"; id: string; organizationId: string } | null>(null)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(treeStateKey)
      if (saved) {
        const parsed: unknown = JSON.parse(saved)
        if (parsed && typeof parsed === "object") {
          const state = parsed as { organizations?: unknown; divisions?: unknown }
          if (Array.isArray(state.organizations) && state.organizations.every((id) => typeof id === "string")) {
            setOpenOrganizations(new Set(state.organizations))
          }
          if (Array.isArray(state.divisions) && state.divisions.every((id) => typeof id === "string")) {
            setOpenDivisions(new Set(state.divisions))
          }
        }
      }
    } catch {
      // Keep the in-memory defaults if local storage is unavailable or malformed.
    }
    setTreeStateLoaded(true)
  }, [treeStateKey])

  useEffect(() => {
    if (!treeStateLoaded) return
    try {
      window.localStorage.setItem(treeStateKey, JSON.stringify({
        organizations: [...openOrganizations],
        divisions: [...openDivisions],
      }))
    } catch {
      // The tree remains usable when local storage is unavailable.
    }
  }, [openDivisions, openOrganizations, treeStateKey, treeStateLoaded])

  function hasPermission(organizationId: string, permission: string) {
    const organization = organizations.find((entry) => entry.id === organizationId)
    const member = organization?.members.find((entry) => entry.id === user.id)
    if (member?.role === "owner") return true
    if (member?.role === "admin") return permission === "manageAccess"
    return member?.permissions?.[permission] === true
  }
  function canManage(organizationId: string) { return hasPermission(organizationId, "editDivision") || hasPermission(organizationId, "editProject") }

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
      setMoveError(cause instanceof Error ? cause.message : t("projects.moveFailed"))
    } finally {
      draggedItem.current = null
      setDraggedItemId(null)
      setDropTarget(null)
    }
  }

  function handleDivisionDragOver(event: React.DragEvent, organizationId: string, divisionId: string) {
    const item = draggedItem.current
    if (!item || !canManage(item.organizationId) || !canManage(organizationId)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
    setDropTarget(`division:${divisionId}`)
  }

  function handleDivisionDrop(event: React.DragEvent, organizationId: string, divisionId: string) {
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

  function handleOrganizationDragOver(event: React.DragEvent, organizationId: string) {
    const item = draggedItem.current
    if (item?.kind !== "division" || !canManage(item.organizationId) || !canManage(organizationId)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
    setDropTarget(`organization:${organizationId}`)
  }

  function handleOrganizationDrop(event: React.DragEvent, organizationId: string) {
    event.preventDefault()
    event.stopPropagation()
    const item = draggedItem.current
    if (item?.kind !== "division" || !canManage(item.organizationId) || !canManage(organizationId)) return
    if (item.organizationId !== organizationId) void finishDrop(() => moveDivision(item.organizationId, item.id, organizationId))
    else { draggedItem.current = null; setDropTarget(null) }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background px-0 py-0 lg:mx-0 lg:w-full lg:max-w-none lg:flex-1 lg:items-stretch lg:justify-start lg:bg-[#f7f7f7] lg:px-2 lg:pt-2">
      <section className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto bg-background lg:flex-none">
        <header className="relative mx-0 mt-0 flex min-h-[104px] w-full items-center overflow-hidden rounded-xl px-6 py-4">
          <div aria-hidden="true" dir="ltr" className="pointer-events-none absolute inset-x-0 top-0 flex h-full items-start overflow-hidden">
            <span className="h-[36px] w-[112px] shrink-0 bg-[#fbe4f6] blur-[30px]" />
            <span className="h-[22px] w-[61px] shrink-0 bg-[#fbe8dc] blur-[30px]" />
            <span className="h-[55px] w-[61px] shrink-0 bg-[#ebf6fb] blur-[30px]" />
            <span className="h-[42px] w-[101px] shrink-0 bg-[#e4ffe7] blur-[30px]" />
            <span className="h-[30px] w-[58px] shrink-0 bg-[#fce5da] blur-[30px]" />
          </div>
          <div className="relative z-10 flex w-full items-center gap-3">
            <div className="relative size-[52px] shrink-0 overflow-hidden rounded-2xl bg-bg2">
              <Image src={user.avatarUrl || "/avatars/default-profile-3d.png"} alt={user.name} fill sizes="52px" unoptimized className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-medium text-foreground">{user.name}</h1>
              <p className="truncate text-sm text-text2">{user.bio?.trim() || t("inbox.memberRole")}</p>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 px-6 py-3 lg:flex-none">
          <a href="/home/projects/MyTasks" className="flex w-full items-center gap-2 rounded-lg border border-border bg-background p-2 text-xs leading-normal font-medium text-[#595959] shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:text-foreground lg:w-auto lg:rounded-none lg:border-0 lg:bg-transparent lg:px-1 lg:py-0 lg:shadow-none">
            <Image src="/images/figma/project-navigation/tasks.svg" width={16} height={16} alt="" />
            {t("nav.myTasks")}
          </a>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-text2">{t("projects.myOrganizations")}</p>
            <Button variant="outline" className="text-foreground" onClick={() => setCreateTarget({ kind: "organization" })}>
              <RemixIcon name="add-line" />{t("projects.addOrganization")}
            </Button>
          </div>
          {moveError && <p role="alert" className="text-sm text-destructive">{moveError}</p>}
          {organizations.map((organization, organizationIndex) => {
            const organizationOpen = openOrganizations.has(organization.id)
            const organizationName = organization.name
            return (
              <section key={organization.id} className={`group/org relative ${organizationIndex > 0 ? "border-t border-border pt-3" : ""}`}>
                <div
                  onDragOver={(event) => handleOrganizationDragOver(event, organization.id)}
                  onDrop={(event) => handleOrganizationDrop(event, organization.id)}
                  className={`flex min-h-9 items-center justify-between gap-3 rounded-md transition-[background-color,outline-color,transform] duration-200 ease-out motion-reduce:transition-none ${dropTarget === `organization:${organization.id}` ? "scale-[1.01] bg-blue-50 outline outline-1 outline-blue-500" : ""}`}
                >
                  <button type="button" aria-label={`${organizationOpen ? t("projects.collapse") : t("projects.expand")} ${organizationName}`} aria-expanded={organizationOpen} onClick={() => setOpenOrganizations((current) => toggle(current, organization.id))} className="grid size-6 shrink-0 place-items-center text-text2">
                    <RemixIcon name="arrow-down-s-fill" className={`shrink-0 text-base transition-transform ${organizationOpen ? "" : collapsedChevronDirection}`} />
                  </button>
                  <Link draggable={false} href={organizationPath(organization)} className="flex min-w-0 flex-1 items-center justify-start gap-2 text-start text-base font-medium text-foreground">
                    <span className="relative grid size-6 shrink-0 place-items-center overflow-hidden rounded-lg bg-bg2 text-text2" aria-hidden="true"><Image src={organization.imageUrl && organization.preferences?.showSidebarIcon === true ? organization.imageUrl : "/images/divisions/general.jpg"} alt="" fill sizes="24px" unoptimized className="object-cover" /></span>
                    <span className="min-w-0 truncate">{organizationName}</span>
                  </Link>
                  <div className="ms-auto flex shrink-0 items-center gap-1">
                    <Link draggable={false} href={`/home/organizations/${organization.id}/settings`} aria-label={`${t("projects.settings")} — ${organizationName}`} title={t("projects.settings")} className="grid size-7 place-items-center rounded text-icon2 hover:bg-bg2 hover:text-foreground"><RemixIcon name="settings-3-line" className="text-xl" /></Link>
                    {hasPermission(organization.id, "createDivision") && <button type="button" draggable={false} aria-label={`${t("projects.addDivision")} — ${organizationName}`} title={t("projects.addDivision")} onClick={() => setCreateTarget({ kind: "division", organizationId: organization.id })} className="grid size-6 place-items-center rounded text-icon2 hover:bg-bg2 hover:text-foreground"><RemixIcon name="add-line" className="text-xl" /></button>}
                  </div>
                </div>
                <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${organizationOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="min-h-0 overflow-hidden">
                    <div className="mt-1 flex flex-col gap-3">
                  {organization.divisions.map((division) => {
                    const divisionOpen = openDivisions.has(division.id)
                    return (
                      <div
                        key={division.id}
                        onDragOver={(event) => handleDivisionDragOver(event, organization.id, division.id)}
                        onDrop={(event) => handleDivisionDrop(event, organization.id, division.id)}
                        className={`group/division relative rounded-md transition-[background-color,outline-color,transform] duration-200 ease-out motion-reduce:transition-none ${dropTarget === `division:${division.id}` ? "scale-[1.01] bg-blue-50 outline outline-1 outline-blue-500" : ""}`}
                      >
                        <div
                          draggable={canManage(organization.id)}
                          onDragStart={(event) => beginDrag(event, { kind: "division", id: division.id, organizationId: organization.id })}
                          onDragEnd={() => { draggedItem.current = null; setDraggedItemId(null); setDropTarget(null) }}
                          className={`group/division-header flex min-h-10 items-center gap-1 rounded-md transition-opacity duration-150 ${canManage(organization.id) ? "cursor-grab active:cursor-grabbing" : ""} ${draggedItemId === division.id ? "opacity-45" : ""}`}
                        >
                          <button type="button" draggable={false} aria-label={`${divisionOpen ? t("projects.collapse") : t("projects.expand")} ${division.name}`} aria-expanded={divisionOpen} onClick={() => setOpenDivisions((current) => toggle(current, division.id))} className="grid size-7 shrink-0 place-items-center rounded-md text-text2 hover:bg-bg2">
                            <RemixIcon name="arrow-down-s-line" className={`shrink-0 text-base text-icon2 transition-transform ${divisionOpen ? "" : collapsedChevronDirection}`} />
                          </button>
                          <Link draggable={false} href={`/home/organizations/${organization.id}?divisionId=${encodeURIComponent(division.id)}`} className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-start">
                            <RemixIcon name="folder-line" className="shrink-0 text-base text-text2" />
                            <span className="min-w-0 flex-1 truncate text-sm text-foreground">{division.name}</span>
                          </Link>
                          <div className="ms-auto flex shrink-0 items-center gap-1 opacity-100 transition-opacity duration-200 lg:opacity-0 lg:group-hover/division-header:opacity-100 lg:group-focus-within/division-header:opacity-100">
                            <Link draggable={false} href={`/home/organizations/${organization.id}/divisions/${encodeURIComponent(division.id)}/settings`} aria-label={`${t("projects.settings")} — ${division.name}`} title={t("projects.settings")} className="grid size-7 place-items-center rounded text-icon2 hover:bg-bg2 hover:text-foreground"><RemixIcon name="settings-3-line" className="text-xl" /></Link>
                            {hasPermission(organization.id, "createProject") && <button type="button" draggable={false} aria-label={`${t("projects.addProject")} — ${division.name}`} onClick={() => setCreateTarget({ kind: "project", organizationId: organization.id, divisionId: division.id })} className="grid size-6 place-items-center rounded text-icon2 hover:text-foreground"><RemixIcon name="add-line" className="text-xl" /></button>}
                          </div>
                        </div>
                        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${divisionOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                          <div className="min-h-0 overflow-hidden">
                            <div className="ms-3 flex flex-col border-s border-border ps-3 pt-1">
                          {division.projects.map((project, index) => (
                            <div
                              key={project.id}
                              draggable={canManage(organization.id)}
                              onDragStart={(event) => beginDrag(event, { kind: "project", id: project.id, organizationId: organization.id })}
                              onDragEnd={() => { draggedItem.current = null; setDraggedItemId(null); setDropTarget(null) }}
                              className={`group/project flex min-h-10 items-center gap-1 rounded-md transition-opacity duration-150 ${canManage(organization.id) ? "cursor-grab active:cursor-grabbing" : ""} ${draggedItemId === project.id ? "opacity-45" : ""}`}
                            >
                              <Link href={projectPath({ ...project, organizationSlug: organization.slug })} draggable={false} className={`flex min-w-0 flex-1 items-center gap-2 rounded-md text-sm hover:text-foreground ${index === 0 ? "font-medium text-foreground" : "text-text2"}`}>
                                <RemixIcon name="list-check-2" className="shrink-0 text-base text-icon2" />
                                <span className="min-w-0 flex-1 truncate">{project.name}</span>
                              </Link>
                              <div className="ms-auto flex shrink-0 items-center gap-1">
                                <Link draggable={false} href={projectPath({ ...project, organizationSlug: organization.slug })} aria-label={`${project.name} — ${t("projects.openProject")}`} title={t("projects.openProject")} className="grid size-7 place-items-center rounded text-icon2 hover:bg-bg2 hover:text-foreground"><RemixIcon name="arrow-right-up-line" className="text-xl" /></Link>
                                <Link draggable={false} href={`/home/projects/${encodeURIComponent(project.id)}/settings`} aria-label={`${t("projects.settings")} — ${project.name}`} title={t("projects.settings")} className="grid size-7 place-items-center rounded text-icon2 hover:bg-bg2 hover:text-foreground"><RemixIcon name="settings-3-line" className="text-xl" /></Link>
                              </div>
                            </div>
                          ))}
                              {hasPermission(organization.id, "createProject") && <button
                                type="button"
                                onClick={() => setCreateTarget({ kind: "project", organizationId: organization.id, divisionId: division.id })}
                                className="flex min-h-7 items-center gap-2 text-start text-sm text-text2 hover:text-foreground"
                              >
                                <RemixIcon name="add-line" className="shrink-0 text-base text-icon2" />
                                <span>{t("projects.addProject")}</span>
                              </button>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                    </div>
                  </div>
                </div>
              </section>
            )
          })}
          {organizations.length === 0 && <p className="py-8 text-center text-sm text-text3">{t("projects.noAccessibleCompanies")}</p>}
        </div>
      </section>
      <ProjectEntityCreateDialog
        target={createTarget}
        onClose={() => setCreateTarget(null)}
        onCreated={(target, createdId) => {
          if (target.kind === "organization") setOpenOrganizations((current) => new Set(current).add(createdId))
          if (target.kind === "division") {
            setOpenOrganizations((current) => new Set(current).add(target.organizationId))
            setOpenDivisions((current) => new Set(current).add(createdId))
          }
          if (target.kind === "project") {
            setOpenOrganizations((current) => new Set(current).add(target.organizationId))
            setOpenDivisions((current) => new Set(current).add(target.divisionId))
          }
        }}
      />
    </div>
  )
}
