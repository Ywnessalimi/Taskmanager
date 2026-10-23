"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useT } from "@/components/providers/locale-provider"
import { RemixIcon } from "@/components/ui/remix-icon"
import { inviteOrganizationMember, updateOrganizationMember } from "@/lib/api/organizations"
import type { Organization, OrganizationMember } from "@/lib/api/types"

const STACK_LIMIT = 5

type OrganizationRole = Extract<OrganizationMember["role"], "owner" | "admin" | "custom">

function memberRole(member: OrganizationMember): OrganizationRole {
  return member.role === "owner" || member.role === "admin" ? member.role : "custom"
}

/**
 * آواتارها فهرست اعضای سازمان را باز می‌کنند؛ دکمهٔ افزودن هم همان پنجره را باز می‌کند.
 * دعوت و تغییر نقش از API سازمان ذخیره می‌شوند.
 */
export function MembersDialog({ organization }: { organization: Organization }) {
  const t = useT()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [members, setMembers] = useState(organization.members)
  const [inviteEmail, setInviteEmail] = useState("")
  const [savingInvite, setSavingInvite] = useState(false)
  const [savingMemberId, setSavingMemberId] = useState("")
  const [error, setError] = useState("")
  const overflowCount = Math.max(0, members.length - STACK_LIMIT)
  const canManageAccess = organization.currentUserRole === "owner"
    || organization.currentUserRole === "admin"
    || organization.currentUserPermissions?.manageAccess === true
  const canInvite = organization.currentUserRole === "owner"
    || organization.currentUserPermissions?.inviteMembers === true

  useEffect(() => setMembers(organization.members), [organization.members])

  async function inviteMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = inviteEmail.trim()
    if (!email || savingInvite) return

    setSavingInvite(true)
    setError("")
    try {
      const invitedMember = await inviteOrganizationMember(organization.id, email)
      setMembers((current) => current.some((member) => member.id === invitedMember.id) ? current : [...current, invitedMember])
      setInviteEmail("")
      router.refresh()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("orgSettings.inviteError"))
    } finally {
      setSavingInvite(false)
    }
  }

  async function updateRole(memberId: string, role: OrganizationRole) {
    if (!canManageAccess || savingMemberId) return
    if (role === "custom") {
      setOpen(false)
      router.push(`/home/organizations/${organization.id}/settings/permissions/${encodeURIComponent(memberId)}`)
      return
    }

    setSavingMemberId(memberId)
    setError("")
    try {
      const result = await updateOrganizationMember(organization.id, memberId, role)
      if (result.transferred) {
        setOpen(false)
      } else {
        setMembers((current) => current.map((member) => member.id === memberId ? { ...member, role } : member))
      }
      router.refresh()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("orgSettings.permissionError"))
    } finally {
      setSavingMemberId("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex w-fit items-center gap-2">
        <DialogTrigger
          aria-label={`${t("members.manage")} ${members.length} ${t("members.membersUnit")}`}
          className="flex w-fit items-center"
        >
          {members.slice(0, STACK_LIMIT).map((member) => (
            <Avatar key={member.id} size="sm" className="-ms-2 ring-2 ring-background first:ms-0">
              {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
              <AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
          ))}
          {overflowCount > 0 && (
            <span className="-ms-2 flex size-6 items-center justify-center rounded-full bg-bg2 text-[10px] text-text2 ring-2 ring-background">
              +{overflowCount}
            </span>
          )}
        </DialogTrigger>
        {canInvite && (
          <button
            type="button"
            aria-label={t("members.addAria")}
            title={t("members.addAria")}
            onClick={() => { setError(""); setOpen(true) }}
            className="grid size-8 shrink-0 place-items-center rounded-md border border-border text-text2 hover:bg-bg2 hover:text-foreground"
          >
            <RemixIcon name="user-add-line" className="text-base" />
          </button>
        )}
      </div>

      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("members.title")} ({members.length})
          </DialogTitle>
        </DialogHeader>

        {canInvite && (
          <form onSubmit={inviteMember} className="flex items-center gap-2 border-b border-border pb-3">
            <input
              required
              type="email"
              dir="ltr"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder={t("orgSettings.emailPlaceholder")}
              className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={savingInvite}
              className="flex h-9 shrink-0 items-center gap-1 rounded-md bg-brand px-3 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              <RemixIcon name="user-add-line" className="text-base" />
              {t("orgSettings.invite")}
            </button>
          </form>
        )}

        {error && <p role="alert" className="text-xs leading-5 text-destructive">{error}</p>}

        <div className="flex flex-col">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-2.5 border-b border-border py-2 last:border-b-0">
              <Avatar size="sm">
                {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                <AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{member.name}</p>
                {member.email && <p className="truncate text-xs text-text2" dir="ltr">{member.email}</p>}
              </div>
              <span className="relative shrink-0">
                <select
                  aria-label={`${t("orgSettings.role")} — ${member.name}`}
                  value={memberRole(member)}
                  disabled={!canManageAccess || savingMemberId !== "" || member.role === "owner" && (members.length < 2 || organization.currentUserRole !== "owner")}
                  onChange={(event) => updateRole(member.id, event.target.value as OrganizationRole)}
                  className="h-8 max-w-36 appearance-none rounded-xl border border-border bg-background pe-7 ps-2 text-xs text-foreground outline-none transition-colors hover:bg-bg2 focus:border-brand disabled:cursor-default disabled:opacity-100"
                >
                  <option value="owner" disabled={organization.currentUserRole !== "owner"}>{t("orgSettings.roleOwner")}</option>
                  <option value="admin">{t("orgSettings.roleAdmin")}</option>
                  <option value="custom">{t("orgSettings.roleCustom")}</option>
                </select>
                <RemixIcon name="arrow-down-s-line" aria-hidden="true" className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 text-[10px] text-text2" />
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
