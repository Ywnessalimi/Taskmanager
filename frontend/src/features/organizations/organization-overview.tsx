"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DialogClose } from "@/components/ui/dialog"
import { SegmentedProgressBar } from "@/components/charts/segmented-progress-bar"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useT } from "@/components/providers/locale-provider"
import { MembersDialog } from "@/features/organizations/members-dialog"
import { OrganizationActivityFeed } from "@/features/organizations/organization-activity-feed"
import { createProject } from "@/lib/api/organizations"
import { projectPath } from "@/lib/organization-paths"
import type { Organization, ProjectRef } from "@/lib/api/types"

function ProjectRow({ project, organizationSlug }: { project: ProjectRef; organizationSlug?: string }) {
  return (
    <Link
      href={projectPath({ ...project, organizationSlug })}
      className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--task-workspace-border)] py-2 last:border-b-0 hover:bg-[var(--task-workspace-bg)]"
    >
      <div className="flex min-w-0 items-center gap-2">
        <RemixIcon name="dashboard-line" className="shrink-0 text-base text-brand" />
        <span className="truncate text-sm text-foreground">{project.name}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-sm text-foreground">{project.progress}%</span>
        <SegmentedProgressBar percent={project.progress} />
      </div>
    </Link>
  )
}

function OrganizationField({ icon, label, children }: { icon: string; label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-10 w-full min-w-0 items-center gap-3 rounded-md py-1 text-start hover:bg-bg2">
      <span className="flex w-30 shrink-0 items-center gap-1.5 text-[13px] text-[var(--task-workspace-muted)]">
        <RemixIcon name={icon} className="text-base" />
        <span>{label}</span>
      </span>
      <div className="min-w-0 flex-1 text-[13px] text-[var(--task-workspace-secondary)]">{children}</div>
    </div>
  )
}

/** نمای سازمان از قاب workspace تسک استفاده می‌کند و محتوای اصلی را با داده‌های سازمان پر می‌کند. */
export function OrganizationOverview({ organization, initialDivisionId, modal = false }: { organization: Organization; initialDivisionId?: string; modal?: boolean }) {
  const t = useT()
  const router = useRouter()
  const displayName = organization.name
  const [divisions, setDivisions] = useState(organization.divisions)
  const [divisionId, setDivisionId] = useState(initialDivisionId && organization.divisions.some((division) => division.id === initialDivisionId) ? initialDivisionId : organization.divisions[0]?.id ?? "")
  const selectedDivision = initialDivisionId ? divisions.find((division) => division.id === initialDivisionId) : undefined
  const canCreateProject = organization.currentUserRole === "owner" || organization.currentUserPermissions?.createProject === true
  const projects = divisions.flatMap((division) => division.projects)
  const [addingProject, setAddingProject] = useState(false)
  const [draftProjectName, setDraftProjectName] = useState("")
  const [savingProject, setSavingProject] = useState(false)
  const [showActivities, setShowActivities] = useState(false)
  const [error, setError] = useState("")

  async function commitNewProject() {
    const name = draftProjectName.trim()
    if (!name || !divisionId || savingProject) return
    setSavingProject(true)
    setError("")
    try {
      const project = await createProject(divisionId, name)
      setDivisions((previous) => previous.map((division) => division.id === divisionId ? { ...division, projects: [...division.projects, { id: project.id, name: project.name, memberIds: organization.members.map((member) => member.id), progress: 0 }] } : division))
      router.refresh()
    } catch {
      setError(t("projects.createFailed"))
      return
    } finally {
      setSavingProject(false)
    }
    setDraftProjectName("")
    setAddingProject(false)
  }

  return (
    <section className={`mx-auto flex min-h-0 w-full max-w-[1072px] flex-1 flex-col overflow-hidden border-0 bg-background text-[var(--task-workspace-text)] ${modal ? "" : "lg:rounded-2xl lg:border lg:border-[var(--task-workspace-border)]"}`}>
      <header className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-[var(--task-workspace-border)] px-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-[var(--task-workspace-soft)] text-[var(--task-workspace-secondary)]">
            <RemixIcon name="building-4-line" className="text-base" />
          </span>
          <span className="hidden truncate text-sm text-[var(--task-workspace-secondary)] sm:inline">{t("projects.companies")}</span>
          <RemixIcon name="arrow-left-s-line" className="shrink-0 text-sm text-[var(--task-workspace-muted)]" />
          <span className="truncate text-sm text-[var(--task-workspace-text)]">{selectedDivision?.name ?? displayName}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href={`/home/organizations/${organization.id}/settings`} aria-label={t("org.settings")} className="grid size-8 place-items-center rounded-lg text-[var(--task-workspace-secondary)] hover:bg-[var(--task-workspace-soft)]">
            <RemixIcon name="settings-3-line" className="text-base" />
          </Link>
          {modal ? <DialogClose aria-label={t("taskDetail.close")} className="grid size-8 place-items-center rounded-lg text-[var(--task-workspace-secondary)] hover:bg-[var(--task-workspace-soft)]"><RemixIcon name="close-line" className="text-base" /></DialogClose> : <Link href="/projects" aria-label={t("projects.all")} className="grid size-8 place-items-center rounded-lg text-[var(--task-workspace-secondary)] hover:bg-[var(--task-workspace-soft)]"><RemixIcon name="close-line" className="text-base" /></Link>}
        </div>
      </header>

      <div className="flex shrink-0 border-b border-border bg-background lg:hidden">
        <button type="button" onClick={() => setShowActivities(false)} aria-pressed={!showActivities} className={`flex-1 py-2 text-sm ${!showActivities ? "border-b-2 border-brand" : ""}`}>{t("org.details")}</button>
        <button type="button" onClick={() => setShowActivities(true)} aria-pressed={showActivities} className={`flex-1 py-2 text-sm ${showActivities ? "border-b-2 border-brand" : ""}`}>{t("org.recentActivity")}</button>
      </div>

      <div className="flex h-full min-h-0 flex-1">
        <main className={`${showActivities ? "hidden lg:flex" : "flex"} min-w-0 flex-1 flex-col`}>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 sm:px-6">
            <div className="flex min-h-13 items-center justify-between gap-3 pt-3">
              <span className="text-sm text-[var(--task-workspace-muted)]" dir="ltr">{organization.slug ? `/${organization.slug}` : organization.id}</span>
              <MembersDialog organization={organization} />
            </div>

            <div className="flex items-center gap-3 pt-2.5 pb-4">
              <RemixIcon name="building-4-line" className="text-xl text-[var(--task-workspace-muted)]" />
              <h1 className="min-w-0 truncate text-lg font-semibold text-[var(--task-workspace-text)]">{selectedDivision?.name ?? displayName}</h1>
            </div>

            <div className="flex flex-col gap-1 pb-4">
              {selectedDivision ? <>
                <OrganizationField icon="building-4-line" label={t("hierarchy.organization")}>{displayName}</OrganizationField>
                <OrganizationField icon="list-check-3" label={t("org.projectsSummary")}>{selectedDivision.projects.length}</OrganizationField>
              </> : <>
                <OrganizationField icon="calendar-todo-line" label={t("org.createdAtPrefix")}>
                  <span dir="ltr">{organization.createdAt}</span>
                </OrganizationField>
                {organization.description && <OrganizationField icon="file-text-line" label={t("projectSettings.description")}>{organization.description}</OrganizationField>}
                <OrganizationField icon="list-check-3" label={t("org.taskCountSuffix")}>
                  {organization.taskCount}
                </OrganizationField>
              </>}
            </div>

            <div className="overflow-hidden"><div className="h-px bg-[var(--task-workspace-border)]" /></div>

            <section className="flex flex-col gap-2 py-4">
              <div className="flex min-h-9 items-center justify-between gap-3">
                <h2 className="text-sm font-medium text-[var(--task-workspace-text)]">{t("org.projectsSummary")}</h2>
                {canCreateProject && !addingProject && <button type="button" onClick={() => setAddingProject(true)} className="flex h-8 shrink-0 items-center gap-1 rounded-lg border border-[var(--task-workspace-border)] px-2 text-xs text-[var(--task-workspace-secondary)] hover:bg-[var(--task-workspace-bg)]"><RemixIcon name="add-line" className="text-base" />{t("org.newProject")}</button>}
              </div>

              {divisions.length ? <div className="flex flex-col border-y border-[var(--task-workspace-border)]">
                {divisions.map((division) => <details key={division.id} open={division.id === initialDivisionId} className="group border-b border-[var(--task-workspace-border)] last:border-b-0">
                  <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 py-2 text-sm text-[var(--task-workspace-secondary)]">
                    <RemixIcon name="arrow-down-s-line" className="shrink-0 text-base text-[var(--task-workspace-muted)] transition-transform group-open:rotate-180" />
                    <span className="min-w-0 flex-1 truncate">{division.name}</span>
                    <span className="text-xs text-[var(--task-workspace-muted)]">{division.projects.length}</span>
                  </summary>
                  <div className="border-t border-[var(--task-workspace-border)] pb-1 ps-6">
                    {division.projects.map((project) => <ProjectRow key={project.id} project={project} organizationSlug={organization.slug} />)}
                  </div>
                </details>)}
              </div> : <p className="py-3 text-sm text-[var(--task-workspace-muted)]">{t("org.noProjects")}</p>}

              {projects.length === 0 && divisions.length > 0 && !addingProject && <p className="text-xs text-[var(--task-workspace-muted)]">{t("org.noProjects")}</p>}
              {addingProject && <form onSubmit={(event) => { event.preventDefault(); void commitNewProject() }} className="mt-2 flex flex-col gap-3 rounded-lg bg-[var(--task-workspace-bg)] p-3">
                <label className="flex flex-col gap-1.5 text-xs text-[var(--task-workspace-muted)]">
                  {t("hierarchy.division")}
                  <select aria-label={t("hierarchy.division")} value={divisionId} onChange={(event) => setDivisionId(event.target.value)} className="h-9 rounded-md border border-[var(--task-workspace-border)] bg-background px-2 text-sm text-foreground" dir="auto">
                    {divisions.map((division) => <option key={division.id} value={division.id}>{division.name}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-xs text-[var(--task-workspace-muted)]">
                  {t("projectSettings.name")}
                  <input autoFocus value={draftProjectName} onChange={(event) => setDraftProjectName(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setAddingProject(false) }} placeholder={t("org.newProjectPlaceholder")} className="h-9 rounded-md border border-[var(--task-workspace-border)] bg-background px-2.5 text-sm text-foreground outline-none focus:border-brand" />
                </label>
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setAddingProject(false)} className="h-8 rounded-lg px-3 text-sm text-[var(--task-workspace-secondary)] hover:bg-background">{t("taskForm.cancel")}</button>
                  <button type="submit" disabled={savingProject || !draftProjectName.trim() || !divisionId} className="h-8 rounded-lg bg-[var(--mini-bar-bg)] px-3 text-sm text-white disabled:opacity-50">{t("org.newProject")}</button>
                </div>
              </form>}
            </section>
          </div>
        </main>

        <aside className={`${showActivities ? "flex" : "hidden"} h-full min-h-0 flex-1 flex-col border-s border-[var(--task-workspace-border)] bg-[var(--task-workspace-bg)] lg:flex lg:w-[361px] lg:flex-none`} aria-label={t("org.recentActivity")}>
          <div className="flex h-14 shrink-0 items-center border-b border-[var(--task-workspace-border)] bg-background px-4">
            <h2 className="text-base font-medium">{t("org.recentActivity")}</h2>
          </div>
          <OrganizationActivityFeed organizationId={organization.id} />
        </aside>
      </div>
    </section>
  )
}
