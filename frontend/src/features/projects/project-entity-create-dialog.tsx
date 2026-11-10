"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useT } from "@/components/providers/locale-provider"
import { RemixIcon } from "@/components/ui/remix-icon"
import { createDivision, createOrganization, createProject } from "@/lib/api/organizations"

export type ProjectEntityCreateTarget =
  | { kind: "organization" }
  | { kind: "division"; organizationId: string }
  | { kind: "project"; organizationId: string; divisionId: string }

export function ProjectEntityCreateDialog({
  target,
  onClose,
  onCreated,
}: {
  target: ProjectEntityCreateTarget | null
  onClose: () => void
  onCreated?: (target: ProjectEntityCreateTarget, createdId: string) => void
}) {
  const t = useT()
  const router = useRouter()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const titleKey = target?.kind === "organization" ? "projects.addOrganization" : target?.kind === "division" ? "projects.addDivision" : "projects.addProject"
  const descriptionKey = target?.kind === "organization" ? "projects.addOrganizationDescription" : target?.kind === "division" ? "projects.addDivisionDescription" : "projects.addProjectDescription"
  const nameKey = target?.kind === "organization" ? "projects.organizationName" : target?.kind === "division" ? "projects.divisionName" : "projects.projectName"

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanName = name.trim()
    if (!target || !cleanName || saving) return
    setError(null)
    setSaving(true)
    try {
      let createdId: string
      if (target.kind === "organization") {
        createdId = (await createOrganization(cleanName)).id
      } else if (target.kind === "division") {
        createdId = (await createDivision(target.organizationId, cleanName)).id
      } else {
        createdId = (await createProject(target.divisionId, cleanName)).id
      }
      onCreated?.(target, createdId)
      setName("")
      onClose()
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("projects.createFailed"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => { if (!open) { setName(""); setError(null); onClose() } }}>
      <DialogContent variant="center" showCloseButton={false} className="max-w-sm">
        <div className="flex items-center justify-end gap-2">
          {(target?.kind === "division" || target?.kind === "project") && <Button type="submit" form="project-entity-create-form" disabled={!name.trim() || saving} className="h-8 min-w-20 rounded-lg text-xs">{t("workspace.register")}</Button>}
          <DialogClose aria-label={t("taskDetail.close")} className="grid size-7 place-items-center rounded-lg bg-bg2"><RemixIcon name="close-line" className="text-base" /></DialogClose>
        </div>
        <DialogHeader>
          <DialogTitle>{t(titleKey)}</DialogTitle>
          <DialogDescription>{t(descriptionKey)}</DialogDescription>
        </DialogHeader>
        <form id="project-entity-create-form" onSubmit={submit} className="flex flex-col gap-4">
          <input autoFocus value={name} onChange={(event) => setName(event.target.value)} aria-label={t(nameKey)} placeholder={t(nameKey)} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {target?.kind === "organization" && <div className="flex justify-end pt-1"><Button type="submit" disabled={!name.trim() || saving} className="h-8 min-w-20 rounded-lg text-xs">{t("workspace.register")}</Button></div>}
        </form>
      </DialogContent>
    </Dialog>
  )
}
