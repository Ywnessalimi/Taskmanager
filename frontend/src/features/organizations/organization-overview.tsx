"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { OrgLogo } from "@/components/layout/org-logo"
import { SegmentedProgressBar } from "@/components/charts/segmented-progress-bar"
import { SectionBox, SectionTitle } from "@/components/layout/section"
import { Separator } from "@/components/ui/separator"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useT } from "@/components/providers/locale-provider"
import { MembersDialog } from "@/features/organizations/members-dialog"
import { createProject } from "@/lib/api/organizations"
import { projectPath } from "@/lib/organization-paths"
import type { Organization, ProjectRef } from "@/lib/api/types"

/**
 * ترتیب عمدی (طبق بازخورد کاربر): آیکون دراپ‌داون و بعد نام پروژه در سمت شروع (راست در RTL)،
 * و نوار پیشرفت در سمت پایان (چپ). چون کلاس‌ها منطقی‌اند، در حالت LTR خودبه‌خود آینه می‌شود.
 */
function ProjectRow({ project, organizationSlug }: { project: ProjectRef; organizationSlug?: string }) {
  return (
    <Link
      href={projectPath({ ...project, organizationSlug })}
      className="flex items-center justify-between gap-3 py-1 hover:opacity-80"
    >
      <div className="flex min-w-0 items-center gap-1.5">
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

/**
 * چیدمان از طرح Figma «Home/OrganizationPage» گرفته شده است، اما با آیکون‌های خودمان
 * (RemixIcon) به‌جای آیکون‌های طرح، و بدون تکرار نوار بالا/پایین طرح (چون آن‌ها همان
 * `PageHeader`/`BottomTabBar`/`SidebarNav` موجود پروژه‌اند). رجوع به README.md همین پوشه.
 */
export function OrganizationOverview({ organization, initialDivisionId }: { organization: Organization; initialDivisionId?: string }) {
  const t = useT()
  const router = useRouter()
  const displayName = organization.name
  const canCreateProject = organization.currentUserRole === "owner" || organization.currentUserPermissions?.createProject === true
  const [divisions, setDivisions] = useState(organization.divisions)
  const [divisionId, setDivisionId] = useState(initialDivisionId && organization.divisions.some((division) => division.id === initialDivisionId) ? initialDivisionId : organization.divisions[0]?.id ?? "")
  const projects = divisions.flatMap((division) => division.projects)
  const [addingProject, setAddingProject] = useState(false)
  const [draftProjectName, setDraftProjectName] = useState("")
  const [savingProject, setSavingProject] = useState(false)
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
    <div className="flex flex-col gap-5">
      {/* لوگو در سمت شروع (راست در RTL) و نام کنارش — طبق بازخورد کاربر. */}
      <div className="flex items-center gap-3">
        <OrgLogo name={displayName} imageUrl={organization.imageUrl} />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm text-text2">{t("org.nameLabel")}</p>
          <p className="truncate text-lg font-medium text-foreground">{displayName}</p>
          {organization.description && <p className="text-sm text-text2">{organization.description}</p>}
        </div>
      </div>

      <p className="text-sm font-medium text-text3">
        {t("org.createdAtPrefix")} {organization.createdAt}
      </p>

      <Separator />

      <div className="flex flex-col gap-3">
        <SectionTitle>{t("org.projectsSummary")}</SectionTitle>
        <div className="flex flex-col gap-3">
          {divisions.map((division) => <details key={division.id} className="group rounded-lg border border-border px-3"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-medium"><span>{division.name}</span><RemixIcon name="arrow-down-s-line" className="text-base text-icon2 transition-transform group-open:rotate-180" /></summary><div className="flex flex-col gap-2 border-t border-border py-2 ps-3">{division.projects.map((project) => <ProjectRow key={project.id} project={project} organizationSlug={organization.slug} />)}</div></details>)}
          {projects.length === 0 && !addingProject && <p className="text-sm text-text2">{t("org.noProjects")}</p>}
          {addingProject ? (
            <div className="flex flex-col gap-2">
              <select aria-label={t("hierarchy.division")} value={divisionId} onChange={(event) => setDivisionId(event.target.value)} className="h-9 rounded-md border border-border bg-background px-2 text-sm">{divisions.map((division) => <option key={division.id} value={division.id}>{division.name}</option>)}</select>
              <input autoFocus value={draftProjectName} onChange={(event) => setDraftProjectName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") commitNewProject(); if (event.key === "Escape") setAddingProject(false) }} placeholder={t("org.newProjectPlaceholder")} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-text3" />
              <button type="button" disabled={savingProject || !divisionId} onClick={() => void commitNewProject()} className="w-fit rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50">{t("org.newProject")}</button>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            </div>
          ) : canCreateProject ? (
            <button type="button" onClick={() => setAddingProject(true)} className="flex w-fit items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text2 hover:bg-bg2 hover:text-foreground">
              {t("org.newProject")}<RemixIcon name="add-circle-line" className="text-base" />
            </button>
          ) : null}
        </div>
      </div>

      <MembersDialog members={organization.members} />

      <Separator />

      <div className="flex flex-col gap-3">
        <SectionTitle>{t("org.recentActivity")}</SectionTitle>
        <SectionBox>
          <p className="py-8 text-center text-sm text-text3">{t("org.noRecentActivity")}</p>
        </SectionBox>
      </div>
    </div>
  )
}
