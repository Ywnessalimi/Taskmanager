"use client"

import Link from "next/link"
import Image from "next/image"
import { ProgressRing } from "@/components/charts/progress-ring"
import { useT } from "@/components/providers/locale-provider"
import type { Organization } from "@/lib/api/types"
import { RemixIcon } from "@/components/ui/remix-icon"

/** درخت شرکت ← معاونت ← پروژه در خانه و مصرف‌کنندگان قدیمی ناوبری. */
export function WorkspaceList({ organizations, showProgress = true }: { organizations: Organization[]; showProgress?: boolean }) {
  const t = useT()
  if (!organizations.length) return <p className="py-8 text-center text-sm text-text2">{t("home.empty")}</p>
  return <div className="flex flex-col">{organizations.map((organization) => (
    <details key={organization.id} className="border-b border-border py-3 last:border-0">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium"><Image src={organization.imageUrl || "/images/divisions/general.jpg"} alt="" width={24} height={24} unoptimized className="size-6 rounded-md object-cover" /><Link href={`/home/organizations/${organization.id}`} className="hover:underline">{organization.name}</Link></summary>
      <div className="ps-5 pt-2">{organization.divisions.map((division) => (
        <details key={division.id} open className="py-1">
          <summary className="flex cursor-pointer items-center gap-2 py-1 text-sm text-text2"><RemixIcon name="folder-line" className="text-base" /><span className="min-w-0 truncate">{division.name}</span></summary>
          <div className="ps-5">{division.projects.map((project) => <Link key={project.id} href={`/home/projects/${project.id}`} className="flex items-center justify-between gap-2 py-2 text-sm hover:bg-bg2"><span>{project.name}</span>{showProgress && <span className="flex items-center gap-2 text-xs text-text2">{project.progress}%<ProgressRing percent={project.progress} /></span>}</Link>)}</div>
        </details>
      ))}</div>
    </details>
  ))}</div>
}
