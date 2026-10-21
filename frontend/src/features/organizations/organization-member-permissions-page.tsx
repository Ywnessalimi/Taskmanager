"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "@/components/providers/locale-provider"
import { Button } from "@/components/ui/button"
import { updateOrganizationMember } from "@/lib/api/organizations"
import type { Organization, OrganizationMember } from "@/lib/api/types"

const permissionItems = [
  ["editOrganization", "permissionEditOrganization"],
  ["createDivision", "permissionCreateDivision"],
  ["editDivision", "permissionEditDivision"],
  ["createProject", "permissionCreateProject"],
  ["editProject", "permissionEditProject"],
  ["inviteMembers", "permissionInviteMembers"],
  ["removeMembers", "permissionRemoveMembers"],
  ["manageAccess", "permissionManageAccess"],
] as const

export function OrganizationMemberPermissionsPage({ organization, member }: { organization: Organization; member: OrganizationMember }) {
  const { t } = useLocale()
  const router = useRouter()
  const [permissions, setPermissions] = useState<Record<string, boolean>>(member.permissions ?? {})
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  async function save() {
    setError("")
    setSaving(true)
    try {
      await updateOrganizationMember(organization.id, member.id, "custom", permissions)
      router.push(`/home/organizations/${organization.id}/settings?section=members`)
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("orgSettings.permissionError"))
    } finally {
      setSaving(false)
    }
  }

  return <main className="min-w-0 flex-1 pb-8">
    <div className="flex flex-col gap-5">
      <div><h2 className="text-lg font-semibold text-foreground">{t("orgSettings.rolePermissions")}</h2><p className="mt-1 text-sm text-text2">{member.name} · {member.email}</p></div>
      <div className="flex flex-col divide-y divide-border border-y border-border">
        {permissionItems.map(([key, label]) => <label key={key} className="flex cursor-pointer items-center gap-3 py-3 text-sm text-foreground">
          <input type="checkbox" checked={Boolean(permissions[key])} onChange={(event) => setPermissions((current) => ({ ...current, [key]: event.target.checked }))} className="size-4 accent-blue-600" />
          <span>{t(`orgSettings.${label}` as never)}</span>
        </label>)}
      </div>
      <div className="flex items-center gap-3 border-t border-border pt-4">
        <Button onClick={() => void save()} disabled={saving}>{t("orgSettings.save")}</Button>
        <Button variant="ghost" onClick={() => router.back()}>{t("orgSettings.cancel")}</Button>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  </main>
}
