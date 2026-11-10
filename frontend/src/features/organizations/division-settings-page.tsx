"use client"

import { useMemo, useState } from "react"
import type { FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useLocale } from "@/components/providers/locale-provider"
import { updateDivisionSettings } from "@/lib/api/organizations"
import type { Division, Organization } from "@/lib/api/types"

export function DivisionSettingsPage({ organization, division }: { organization: Organization; division: Division }) {
  const { locale, t } = useLocale()
  const router = useRouter()
  const [name, setName] = useState(division.name)
  const [memberIds, setMemberIds] = useState(() => new Set(division.memberIds.filter((id) => organization.members.some((member) => member.id === id))))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedSignature, setSavedSignature] = useState(() => JSON.stringify({ name: division.name, memberIds: [...division.memberIds].sort() }))
  const [error, setError] = useState("")
  const signature = useMemo(() => JSON.stringify({ name, memberIds: [...memberIds].sort() }), [memberIds, name])
  const canEdit = organization.currentUserRole === "owner" || organization.currentUserPermissions?.editDivision === true

  function toggleMember(memberId: string) {
    setSaved(false)
    setError("")
    setMemberIds((current) => {
      const next = new Set(current)
      if (next.has(memberId)) next.delete(memberId)
      else next.add(memberId)
      return next
    })
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canEdit || saving || !name.trim()) return
    setSaving(true)
    setError("")
    try {
      const result = await updateDivisionSettings(organization.id, division.id, { name: name.trim(), memberIds: [...memberIds] })
      setName(result.name)
      setMemberIds(new Set(result.memberIds))
      setSavedSignature(JSON.stringify({ name: result.name, memberIds: [...result.memberIds].sort() }))
      setSaved(true)
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("divisionSettings.saveError"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3 lg:px-8">
        <Link href="/projects" aria-label={t("projects.all")} className="grid size-8 shrink-0 place-items-center rounded-md text-icon2 hover:bg-bg2 hover:text-foreground">
          <RemixIcon name={locale === "fa" ? "arrow-right-line" : "arrow-left-line"} className="text-lg" />
        </Link>
        <div className="min-w-0">
          <p className="truncate text-xs text-text2">{organization.name} / {division.name}</p>
          <h1 className="text-lg font-semibold text-foreground">{t("divisionSettings.title")}</h1>
        </div>
      </header>

      <form onSubmit={(event) => { void save(event) }} className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-7 px-4 py-6 lg:px-8 lg:py-8">
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-foreground">{t("divisionSettings.general")}</h2>
          <label className="flex flex-col gap-1.5 text-sm text-text2">
            {t("divisionSettings.name")}
            <input value={name} maxLength={200} disabled={!canEdit || saving} onChange={(event) => { setName(event.target.value); setSaved(false); setError("") }} className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60" />
          </label>
        </section>

        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">{t("divisionSettings.members")}</h2>
            <p className="mt-1 text-sm text-text2">{t("divisionSettings.membersDescription")}</p>
          </div>
          <div className="divide-y divide-border rounded-md border border-border">
            {organization.members.map((member) => <label key={member.id} className="flex min-h-12 cursor-pointer items-center gap-3 px-3 py-2 text-sm text-foreground has-[:disabled]:cursor-not-allowed">
              <input type="checkbox" checked={memberIds.has(member.id)} disabled={!canEdit || saving} onChange={() => toggleMember(member.id)} className="size-4 accent-brand" />
              <span className="min-w-0 flex-1 truncate">{member.name}</span>
              {member.email && <span className="hidden truncate text-xs text-text2 sm:block">{member.email}</span>}
            </label>)}
            {organization.members.length === 0 && <p className="px-3 py-4 text-sm text-text2">{t("divisionSettings.noMembers")}</p>}
          </div>
        </section>

        {!canEdit && <p className="text-sm text-text2">{t("divisionSettings.noPermission")}</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="mt-auto flex items-center justify-end gap-3 border-t border-border pt-4">
          {saved && signature === savedSignature && <p role="status" className="me-auto text-sm text-text2">{t("divisionSettings.saved")}</p>}
          <button type="submit" disabled={!canEdit || saving || !name.trim() || signature === savedSignature} className="h-9 rounded-md bg-brand px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? t("divisionSettings.saving") : t("divisionSettings.save")}
          </button>
        </div>
      </form>
    </div>
  )
}
