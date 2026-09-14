"use client"

import { useState } from "react"
import Link from "next/link"
import { SectionBox, SectionTitle } from "@/components/layout/section"
import { Separator } from "@/components/ui/separator"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useT } from "@/components/providers/locale-provider"
import { MembersDialog } from "@/features/organizations/members-dialog"
import type { Organization, ProjectRef } from "@/lib/api/types"

/** جای‌گزین لوگوی سازمان (بدون عکس واقعی) — مربعی هم‌راستا با اواتارهای دایره‌ای اعضا. */
function OrgLogo({ name }: { name: string }) {
  return (
    <div className="flex size-[60px] shrink-0 items-center justify-center rounded-lg border border-border bg-bg2 text-lg font-medium text-text2">
      {name.slice(0, 1)}
    </div>
  )
}

function ProjectRow({ project }: { project: ProjectRef }) {
  return (
    <Link
      href={`/home/projects/${project.id}`}
      className="flex items-center justify-between gap-3 py-1 hover:opacity-80"
    >
      <div className="flex shrink-0 items-center gap-2">
        <div className="h-2 w-24 overflow-hidden rounded-full bg-bg2">
          <div className="h-full rounded-full bg-brand" style={{ width: `${project.progress}%` }} />
        </div>
        <span className="text-sm text-foreground">{project.progress}%</span>
      </div>
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="truncate text-sm text-foreground">{project.name}</span>
        <RemixIcon name="arrow-down-s-line" className="shrink-0 text-base text-icon2" />
      </div>
    </Link>
  )
}

/**
 * چیدمان از طرح Figma «Home/OrganizationPage» گرفته شده است، اما با آیکون‌های خودمان
 * (RemixIcon) به‌جای آیکون‌های طرح، و بدون تکرار نوار بالا/پایین طرح (چون آن‌ها همان
 * `PageHeader`/`BottomTabBar`/`SidebarNav` موجود پروژه‌اند). رجوع به README.md همین پوشه.
 */
export function OrganizationOverview({ organization }: { organization: Organization }) {
  const t = useT()
  const [projects, setProjects] = useState(organization.projects)
  const [addingProject, setAddingProject] = useState(false)
  const [draftProjectName, setDraftProjectName] = useState("")

  function commitNewProject() {
    const name = draftProjectName.trim()
    if (name) {
      setProjects((prev) => [...prev, { id: `local-${Date.now()}`, name, progress: 0 }])
    }
    setDraftProjectName("")
    setAddingProject(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-sm text-text2">{t("org.nameLabel")}</p>
          <p className="truncate text-lg font-medium text-foreground">{organization.name}</p>
        </div>
        <OrgLogo name={organization.name} />
      </div>

      <p className="text-sm font-medium text-text3">
        {t("org.createdAtPrefix")} {organization.createdAt}
      </p>

      <MembersDialog members={organization.members} />

      {/* دو ردیف دکوراتیو مطابق طرح — سازمان هنوز فیلد توضیحات/پیوست فایل در مدل داده ندارد،
          مثل ردیف «الصاق فایل» غیرفعال در task-create-form.tsx و project-overview.tsx. */}
      <p className="text-base text-text3">{t("org.addDescription")}</p>
      <div className="flex w-fit items-center gap-1.5 text-sm text-text2">
        {t("org.addFile")}
        <RemixIcon name="attachment-line" className="text-base" />
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <SectionTitle>{t("org.projectsSummary")}</SectionTitle>
        <div className="flex flex-col gap-3">
          {projects.map((project) => (
            <ProjectRow key={project.id} project={project} />
          ))}
          {projects.length === 0 && !addingProject && (
            <p className="text-sm text-text2">{t("org.noProjects")}</p>
          )}
          {addingProject ? (
            <input
              autoFocus
              value={draftProjectName}
              onChange={(e) => setDraftProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitNewProject()
                if (e.key === "Escape") setAddingProject(false)
              }}
              onBlur={commitNewProject}
              placeholder={t("org.newProjectPlaceholder")}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-text3"
            />
          ) : (
            <button
              type="button"
              onClick={() => setAddingProject(true)}
              className="flex w-fit items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text2 hover:bg-bg2 hover:text-foreground"
            >
              {t("org.newProject")}
              <RemixIcon name="add-circle-line" className="text-base" />
            </button>
          )}
        </div>
      </div>

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
