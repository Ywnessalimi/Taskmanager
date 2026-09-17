"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { OrgLogo } from "@/components/layout/org-logo"
import { SegmentedProgressBar } from "@/components/charts/segmented-progress-bar"
import { SectionBox, SectionTitle } from "@/components/layout/section"
import { Separator } from "@/components/ui/separator"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useT } from "@/components/providers/locale-provider"
import { MembersDialog } from "@/features/organizations/members-dialog"
import type { Organization, ProjectRef } from "@/lib/api/types"

/**
 * ترتیب عمدی (طبق بازخورد کاربر): آیکون دراپ‌داون و بعد نام پروژه در سمت شروع (راست در RTL)،
 * و نوار پیشرفت در سمت پایان (چپ). چون کلاس‌ها منطقی‌اند، در حالت LTR خودبه‌خود آینه می‌شود.
 */
function ProjectRow({ project }: { project: ProjectRef }) {
  return (
    <Link
      href={`/home/projects/${project.id}`}
      className="flex items-center justify-between gap-3 py-1 hover:opacity-80"
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <RemixIcon name="arrow-down-s-line" className="shrink-0 text-base text-icon2" />
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
export function OrganizationOverview({ organization }: { organization: Organization }) {
  const t = useT()
  const [projects, setProjects] = useState(organization.projects)
  const [addingProject, setAddingProject] = useState(false)
  const [draftProjectName, setDraftProjectName] = useState("")
  const [files, setFiles] = useState<{ id: string; name: string; sizeLabel: string }[]>([])
  /** شمارنده‌ی محلی شناسه‌ی فایل‌ها؛ عمداً Date.now نیست تا رندر خالص بماند. */
  const nextFileId = useRef(1)

  /**
   * آپلود واقعی وجود ندارد: هر کلیک یک فایل نمادین به فهرست اضافه می‌کند تا رفتار
   * «افزودن پیوست» دیده شود. با رفرش صفحه پاک می‌شود (مثل بقیه‌ی state های این اپ).
   */
  function addFile() {
    const index = nextFileId.current++
    setFiles((prev) => [
      ...prev,
      { id: `file-${index}`, name: `${t("org.attachmentName")} ${index}.pdf`, sizeLabel: "۱.۲ MB" },
    ])
  }

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
      {/* لوگو در سمت شروع (راست در RTL) و نام کنارش — طبق بازخورد کاربر. */}
      <div className="flex items-center gap-3">
        <OrgLogo name={organization.name} />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm text-text2">{t("org.nameLabel")}</p>
          <p className="truncate text-lg font-medium text-foreground">{organization.name}</p>
        </div>
      </div>

      <p className="text-sm font-medium text-text3">
        {t("org.createdAtPrefix")} {organization.createdAt}
      </p>

      <MembersDialog members={organization.members} />

      {/* ردیف توضیحات هنوز دکوراتیو است (سازمان فیلد توضیحات در مدل داده ندارد). */}
      <p className="text-base text-text3">{t("org.addDescription")}</p>

      <div className="flex flex-col gap-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2"
          >
            <RemixIcon name="file-line" className="shrink-0 text-base text-icon2" />
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">{file.name}</span>
            <span className="shrink-0 text-xs text-text2">{file.sizeLabel}</span>
            <button
              type="button"
              onClick={() => setFiles((prev) => prev.filter((f) => f.id !== file.id))}
              aria-label={`${t("org.removeFile")} ${file.name}`}
              className="flex size-6 shrink-0 items-center justify-center rounded-md text-icon2 hover:bg-bg2 hover:text-icon"
            >
              <RemixIcon name="close-line" className="text-sm" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addFile}
          className="flex w-fit items-center gap-1.5 rounded-md py-1 text-sm text-text2 hover:text-foreground"
        >
          {t("org.addFile")}
          <RemixIcon name="attachment-line" className="text-base" />
        </button>
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
