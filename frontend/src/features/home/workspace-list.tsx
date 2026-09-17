"use client"

import { useState } from "react"
import Link from "next/link"
import { ProgressRing } from "@/components/charts/progress-ring"
import { useT } from "@/components/providers/locale-provider"
import { RemixIcon } from "@/components/ui/remix-icon"
import type { Organization, ProjectRef } from "@/lib/api/types"

function OrganizationRow({ org, showProgress }: { org: Organization; showProgress: boolean }) {
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState<ProjectRef[]>(org.projects)
  const [adding, setAdding] = useState(false)
  const [draftName, setDraftName] = useState("")
  const t = useT()

  function commitNewProject() {
    const name = draftName.trim()
    if (name) {
      setProjects((prev) => [...prev, { id: `local-${Date.now()}`, name, progress: 0 }])
    }
    setDraftName("")
    setAdding(false)
  }

  return (
    <div className="border-b border-border last:border-b-0">
      <div className="flex items-center gap-1 py-2.5">
        {/* شورون در سمت شروع (راست در RTL) و دقیقاً چسبیده به نام سازمان — بدون لوگو. */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={`${open ? t("home.collapse") : t("home.expand")} ${org.name}`}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-icon2 hover:bg-bg2 hover:text-icon"
        >
          <RemixIcon name={open ? "arrow-up-s-line" : "arrow-down-s-line"} className="text-lg" />
        </button>

        <Link
          href={`/home/organizations/${org.id}`}
          className="min-w-0 flex-1 truncate text-sm font-medium text-foreground"
        >
          {org.name}
        </Link>

        {open && (
          <button
            type="button"
            onClick={() => setAdding((a) => !a)}
            aria-label={`${t("home.addProjectIn")} ${org.name}`}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-icon2 hover:bg-bg2 hover:text-icon"
          >
            <RemixIcon name="add-line" className="text-base" />
          </button>
        )}
      </div>

      {open && (
        <div className="flex flex-col gap-0.5 ps-8 pb-2">
          {projects.map((project, index) => (
            <Link
              key={project.id}
              href={`/home/projects/${project.id}`}
              className="flex items-center justify-between gap-2 py-1.5 hover:opacity-80"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-bg2 text-[11px] text-text2">
                  {index + 1}
                </span>
                <span className="truncate text-sm text-text2">{project.name}</span>
              </span>
              {showProgress && (
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-text2">
                  {project.progress}% {t("home.progress")}
                  <ProgressRing percent={project.progress} />
                </span>
              )}
            </Link>
          ))}
          {projects.length === 0 && !adding && (
            <p className="py-1.5 text-sm text-text3">{t("home.noProjects")}</p>
          )}
          {adding && (
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitNewProject()
                if (e.key === "Escape") setAdding(false)
              }}
              onBlur={commitNewProject}
              placeholder={t("home.newProjectPlaceholder")}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-text3"
            />
          )}
        </div>
      )}
    </div>
  )
}

export function WorkspaceList({
  organizations,
  showProgress = true,
}: {
  organizations: Organization[]
  /** ساید‌بار دسکتاپ فضای کمی دارد و درصد پیشرفت آنجا لازم نیست — فقط در صفحه‌ی خانه نشان داده می‌شود. */
  showProgress?: boolean
}) {
  const t = useT()

  if (organizations.length === 0) {
    return <p className="py-8 text-center text-sm text-text2">{t("home.empty")}</p>
  }

  return (
    <div className="flex flex-col">
      {organizations.map((org) => (
        <OrganizationRow key={org.id} org={org} showProgress={showProgress} />
      ))}
    </div>
  )
}
