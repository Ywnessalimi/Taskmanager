"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useLocale } from "@/components/providers/locale-provider"
import { getOrganization } from "@/lib/api/organizations"
import { addProjectMember } from "@/lib/api/projects"
import type { Organization, OrganizationMember, Project } from "@/lib/api/types"

export function ProjectMembersDialog({ project }: { project: Project }) {
  const { t } = useLocale()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [organization, setOrganization] = useState<Organization>()
  const [addedMembers, setAddedMembers] = useState<OrganizationMember[]>([])
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<OrganizationMember>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const members = [...project.members, ...addedMembers.filter(added => !project.members.some(member => member.id === added.id))]
  const canAdd = organization?.currentUserRole === "owner" || organization?.currentUserPermissions?.editProject === true
  const normalized = query.trim().toLocaleLowerCase()
  const candidates = normalized ? (organization?.members ?? []).filter(member => !members.some(existing => existing.id === member.id) && `${member.name} ${member.email ?? ""}`.toLocaleLowerCase().includes(normalized)).slice(0, 8) : []

  useEffect(() => {
    if (!open) return
    let active = true
    getOrganization(project.organizationId).then(result => { if (active) { setOrganization(result); if (!result) setError(t("projectMembers.loadError")) } }).catch(() => { if (active) setError(t("projectMembers.loadError")) })
    return () => { active = false }
  }, [open, project.organizationId, t])

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canAdd || busy || !normalized) return
    const matches = (organization?.members ?? []).filter(item => item.name.trim().toLocaleLowerCase() === normalized || item.email?.trim().toLocaleLowerCase() === normalized)
    if (!selected && matches.length > 1) { setError(t("projectMembers.chooseSuggestion")); return }
    const member = selected ?? matches[0]
    if (!member) { setError(t("projectMembers.notInOrganization")); return }
    if (members.some(item => item.id === member.id)) { setError(t("projectMembers.alreadyMember")); return }
    setBusy(true)
    setError("")
    try {
      await addProjectMember(project.id, member.id)
      setAddedMembers(previous => [...previous, member])
      setQuery("")
      setSelected(undefined)
      router.refresh()
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("projectMembers.loadError")) }
    finally { setBusy(false) }
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger aria-label={t("projectMembers.title")} className="flex w-fit items-center rounded-md focus-visible:outline-2 focus-visible:outline-ring">
      {members.slice(0, 5).map(member => <Avatar key={member.id} size="sm" className="-ms-2 ring-2 ring-background first:ms-0"><AvatarImage src={member.avatarUrl} alt={member.name} /><AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback></Avatar>)}
      {members.length > 5 && <span className="-ms-2 flex size-6 items-center justify-center rounded-full bg-bg2 text-[10px] text-text2 ring-2 ring-background">+{members.length - 5}</span>}
    </DialogTrigger>
    <DialogContent className="max-h-[80vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{t("projectMembers.title")} ({members.length})</DialogTitle></DialogHeader>
      {canAdd && <form onSubmit={event => void add(event)} className="flex flex-col gap-2 border-b border-border pb-3">
        <div className="flex gap-2"><input value={query} onChange={event => { setQuery(event.target.value); setSelected(undefined); setError("") }} placeholder={t("projectMembers.search")} aria-label={t("projectMembers.search")} className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-brand" /><Button type="submit" disabled={busy || !normalized}>{t("projectMembers.add")}</Button></div>
        {!selected && candidates.length > 0 && <div className="flex flex-col rounded-md border border-border">{candidates.map(member => <button type="button" key={member.id} onClick={() => { setSelected(member); setQuery(member.name); setError("") }} className="flex items-center gap-2 px-3 py-2 text-start text-sm hover:bg-bg2"><span>{member.name}</span>{member.email && <span dir="ltr" className="text-xs text-text2">{member.email}</span>}</button>)}</div>}
      </form>}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      <div className="flex flex-col">{members.map(member => <div key={member.id} className="flex items-center gap-2.5 border-b border-border py-2 last:border-b-0"><Avatar size="sm"><AvatarImage src={member.avatarUrl} alt={member.name} /><AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback></Avatar><span className="truncate text-sm">{member.name}</span></div>)}</div>
    </DialogContent>
  </Dialog>
}
