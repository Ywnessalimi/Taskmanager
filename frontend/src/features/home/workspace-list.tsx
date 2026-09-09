"use client"

import { useState } from "react"
import Link from "next/link"
import { RemixIcon } from "@/components/ui/remix-icon"
import type { Organization, ProjectRef } from "@/lib/api/types"

function OrganizationRow({ org }: { org: Organization }) {
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState<ProjectRef[]>(org.projects)
  const [adding, setAdding] = useState(false)
  const [draftName, setDraftName] = useState("")

  function commitNewProject() {
    const name = draftName.trim()
    if (name) {
      setProjects((prev) => [...prev, { id: `local-${Date.now()}`, name }])
    }
    setDraftName("")
    setAdding(false)
  }

  return (
    <div className="border-b border-border last:border-b-0">
      <div className="flex items-center gap-1 py-2.5">
        <Link href={`/home/organizations/${org.id}`} className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {org.name}
        </Link>

        {open && (
          <button
            type="button"
            onClick={() => setAdding((a) => !a)}
            aria-label={`افزودن پروژه در ${org.name}`}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-icon2 hover:bg-bg2 hover:text-icon"
          >
            <RemixIcon name="add-line" className="text-base" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? `بستن ${org.name}` : `باز کردن ${org.name}`}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-icon2 hover:bg-bg2 hover:text-icon"
        >
          <RemixIcon name={open ? "arrow-up-s-line" : "arrow-down-s-line"} className="text-lg" />
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-0.5 ps-8 pb-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/home/projects/${project.id}`}
              className="truncate py-1.5 text-sm text-text2 hover:text-foreground"
            >
              {project.name}
            </Link>
          ))}
          {projects.length === 0 && !adding && (
            <p className="py-1.5 text-sm text-text3">هنوز پروژه‌ای ندارد.</p>
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
              placeholder="نام پروژه‌ی جدید"
              className="rounded-md border border-border bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-text3"
            />
          )}
        </div>
      )}
    </div>
  )
}

export function WorkspaceList({ organizations }: { organizations: Organization[] }) {
  if (organizations.length === 0) {
    return <p className="py-8 text-center text-sm text-text2">هنوز عضو هیچ سازمانی نیستید.</p>
  }

  return (
    <div className="flex flex-col">
      {organizations.map((org) => (
        <OrganizationRow key={org.id} org={org} />
      ))}
    </div>
  )
}
