"use client"

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useLocale } from "@/components/providers/locale-provider"
import type { Organization, CurrentUser } from "@/lib/api/types"
import { inviteOrganizationMember, removeOrganizationMember, updateOrganizationMember, updateOrganizationSettings } from "@/lib/api/organizations"

type OrgRole = "owner" | "admin" | "custom"
type OrgMember = { id: string; name: string; email: string; avatarUrl?: string; role: OrgRole }
type OrgProperty = { id: string; name: string; type: "text" | "date" | "number" }
type Tab = "general" | "members" | "properties" | "email" | "notifications" | "features" | "advanced"
type OrgSettings = {
  name: string
  slug: string
  description: string
  imageUrl: string | null
  showSidebarIcon: boolean
  createFromEmail: boolean
  notifications: Record<string, boolean>
  features: Record<string, boolean>
  properties: OrgProperty[]
}

const OPTIONS = ["priority", "schedule", "assignees", "status", "approval", "editing", "moving"]
const DEFAULTS: Omit<OrgSettings, "name" | "slug" | "description" | "imageUrl"> = {
  showSidebarIcon: false,
  createFromEmail: false,
  notifications: { upcoming: true, comments: true, chat: true },
  features: Object.fromEntries(OPTIONS.map((option) => [option, option !== "moving"])),
  properties: [],
}

export function OrganizationSettingsPage({ organization, user }: { organization: Organization; user: CurrentUser }) {
  const { t } = useLocale()
  const router = useRouter()
  const [active, setActive] = useState<Tab>("general")
  const [settingsDraft, setSettingsDraft] = useState<OrgSettings | null>(null)
  const preferences = organization.preferences as Partial<OrgSettings> | undefined
  const settings = settingsDraft ?? {
    ...DEFAULTS,
    ...preferences,
    notifications: { ...DEFAULTS.notifications, ...preferences?.notifications },
    features: { ...DEFAULTS.features, ...preferences?.features },
    name: organization.name,
    slug: organization.slug ?? organization.id,
    description: organization.description ?? "",
    imageUrl: organization.imageUrl ?? null,
  }
  const apiMembers = useMemo(() => organization.members.map((member): OrgMember => ({
    id: member.id,
    name: member.name || user.name,
    email: member.id === user.id ? user.email : member.email ?? `${member.id}@example.com`,
    avatarUrl: member.id === user.id ? user.avatarUrl : member.avatarUrl,
    role: member.role === "owner" ? "owner" : member.role === "admin" ? "admin" : "custom",
  })), [organization.members, user.avatarUrl, user.email, user.id, user.name])
  const members = apiMembers
  const [invite, setInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedSignature, setSavedSignature] = useState(() => JSON.stringify(settings))
  const [failedSignature, setFailedSignature] = useState<string | null>(null)
  const [requestError, setRequestError] = useState("")
  const settingsSignature = JSON.stringify(settings)

  const roleLabel = (role: OrgRole) => ({ owner: t("orgSettings.roleOwner"), admin: t("orgSettings.roleAdmin"), custom: t("orgSettings.roleCustom") })[role]
  const owner = useMemo(() => members.find((member) => member.role === "owner"), [members])
  const canManageAccess = organization.currentUserRole === "owner" || organization.currentUserRole === "admin" || organization.currentUserPermissions?.manageAccess === true
  const canInviteMembers = organization.currentUserRole === "owner" || organization.currentUserPermissions?.inviteMembers === true
  const canRemoveMembers = organization.currentUserRole === "owner" || organization.currentUserPermissions?.removeMembers === true

  async function persist(nextSettings: OrgSettings, signature: string) {
    setSaving(true)
    setRequestError("")
    try {
      await updateOrganizationSettings(organization.id, {
        name: nextSettings.name.trim(),
        slug: nextSettings.slug.trim(),
        description: nextSettings.description,
        imageUrl: nextSettings.imageUrl,
        preferences: {
          showSidebarIcon: nextSettings.showSidebarIcon,
          createFromEmail: nextSettings.createFromEmail,
          notifications: nextSettings.notifications,
          features: nextSettings.features,
          properties: nextSettings.properties,
        },
      })
      setSaved(true)
      setSavedSignature(signature)
      setFailedSignature(null)
      router.refresh()
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : t("orgSettings.saveError"))
      setFailedSignature(signature)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (!settingsDraft || settingsSignature === savedSignature || settingsSignature === failedSignature || saving || !settings.name.trim() || !settings.slug.trim()) return
    const timeout = window.setTimeout(() => { void persist(settingsDraft, settingsSignature) }, 650)
    return () => window.clearTimeout(timeout)
    // persist uses the settings snapshot captured by this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsDraft, settingsSignature, savedSignature, saving, failedSignature])

  function updateSetting<K extends keyof OrgSettings>(key: K, value: OrgSettings[K]) {
    setSettingsDraft((current) => ({ ...(current ?? settings), [key]: value }))
    setSaved(false)
  }

  async function updateRole(memberId: string, role: OrgRole) {
    if (role === "custom") {
      router.push(`/home/organizations/${organization.id}/settings/permissions/${encodeURIComponent(memberId)}`)
      return
    }
    setRequestError("")
    try {
      await updateOrganizationMember(organization.id, memberId, role)
      router.refresh()
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : t("orgSettings.permissionError"))
    }
  }

  function addMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = inviteEmail.trim()
    if (!email) return
    setRequestError("")
    void inviteOrganizationMember(organization.id, email).then(() => {
      setInviteEmail("")
      setInvite(false)
      router.refresh()
    }).catch((error: unknown) => setRequestError(error instanceof Error ? error.message : t("orgSettings.inviteError")))
  }

  async function removeMember(memberId: string) {
    const member = members.find((item) => item.id === memberId)
    if (!member || member.role === "owner") return
    setRequestError("")
    try {
      await removeOrganizationMember(organization.id, memberId)
      router.refresh()
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : t("orgSettings.permissionError"))
    }
  }

  const mainNav: { id: Tab; label: string }[] = [
    { id: "general", label: t("orgSettings.general") },
    { id: "members", label: t("orgSettings.members") },
    { id: "properties", label: t("orgSettings.properties") },
  ]
  const optionNav: { id: Tab; label: string }[] = [
    { id: "email", label: t("orgSettings.email") },
    { id: "notifications", label: t("orgSettings.notifications") },
    { id: "features", label: t("orgSettings.features") },
    { id: "advanced", label: t("orgSettings.advanced") },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <header className="border-b border-border px-5 py-4 lg:px-10">
        <h1 className="text-xl font-semibold text-foreground">{t("orgSettings.title")}</h1>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-6 md:flex-row lg:gap-12 lg:px-10 lg:py-8">
        <nav aria-label={t("orgSettings.navigation")} className="flex shrink-0 gap-1 overflow-x-auto md:w-44 md:flex-col md:gap-0">
          {mainNav.map((item) => <NavButton key={item.id} selected={active === item.id} onClick={() => setActive(item.id)}>{item.label}</NavButton>)}
          <p className="hidden px-2 pb-1 pt-4 text-sm font-semibold text-foreground md:block">{t("orgSettings.options")}</p>
          <button type="button" onClick={() => setActive("email")} className={`shrink-0 rounded-sm px-3 py-1.5 text-start text-sm font-semibold md:hidden ${optionNav.some((item) => item.id === active) ? "text-brand" : "text-text2"}`}>{t("orgSettings.options")}</button>
          {optionNav.map((item) => <NavButton key={item.id} selected={active === item.id} nested onClick={() => {
            setActive(item.id)
            requestAnimationFrame(() => document.getElementById(`org-option-${item.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }))
          }}>{item.label}</NavButton>)}
        </nav>

        <main className="min-w-0 flex-1 pb-8">
          {active === "general" && <GeneralSettings settings={settings} update={updateSetting} t={t} onImageError={setRequestError} />}
          {active === "members" && <MembersSettings members={members} ownerId={owner?.id ?? ""} currentUserRole={organization.currentUserRole === "admin" ? "admin" : organization.currentUserRole === "owner" ? "owner" : "custom"} canManageAccess={canManageAccess} canInvite={canInviteMembers} canRemove={canRemoveMembers} roleLabel={roleLabel} onRole={updateRole} onRemove={removeMember} invite={invite} setInvite={setInvite} inviteEmail={inviteEmail} setInviteEmail={setInviteEmail} onInvite={addMember} t={t} />}
          {active === "properties" && <PropertiesSettings properties={settings.properties} onChange={(properties) => updateSetting("properties", properties)} t={t} />}
          {(active === "email" || active === "notifications" || active === "features") && <OptionsSettings settings={settings} update={updateSetting} t={t} />}
          {active === "advanced" && <AdvancedSettings organization={organization} t={t} />}
          {saved && <p role="status" className="mt-8 text-xs text-text2">{t("orgSettings.saved")}</p>}
          {requestError && <p role="alert" className="mt-3 text-sm text-destructive">{requestError}</p>}
        </main>
      </div>
    </div>
  )
}

function NavButton({ children, selected, nested, onClick }: { children: React.ReactNode; selected: boolean; nested?: boolean; onClick: () => void }) {
  return <button type="button" aria-current={selected ? "page" : undefined} onClick={onClick} className={`shrink-0 rounded-sm px-3 py-1.5 text-start text-sm transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring ${nested ? "md:ms-3" : ""} ${selected ? "font-semibold text-foreground" : "text-text2"}`}>{children}</button>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1.5 text-sm text-text2">{label}{children}</label>
}

const controlClass = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40"

function GeneralSettings({ settings, update, t, onImageError }: { settings: OrgSettings; update: <K extends keyof OrgSettings>(key: K, value: OrgSettings[K]) => void; t: (key: never) => string; onImageError: (message: string) => void }) {
  const imageInput = useRef<HTMLInputElement>(null)
  const origin = useSyncExternalStore(() => () => undefined, () => window.location.origin, () => "https://quire.app")
  async function selectImage(file?: File) {
    if (!file) return
    if (!file.type.startsWith("image/")) { onImageError(t("orgSettings.imageTypeError" as never)); return }
    try {
      const dataUrl = await compressOrganizationImage(file)
      update("imageUrl", dataUrl)
      onImageError("")
    } catch {
      onImageError(t("orgSettings.imageSizeError" as never))
    }
  }

  return <div className="flex flex-col gap-5">
    <h2 className="text-lg font-semibold text-foreground">{t("orgSettings.profile" as never)}</h2>
    <Field label={t("orgSettings.picture" as never)}>
      <input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => { void selectImage(event.target.files?.[0]); event.target.value = "" }} />
      <button type="button" onClick={() => imageInput.current?.click()} aria-label={t("orgSettings.uploadPicture" as never)} className="group relative w-fit rounded-md focus-visible:outline-2 focus-visible:outline-ring">
        <Avatar className="size-24 rounded-md"><AvatarImage src={settings.imageUrl ?? undefined} alt={settings.name} /><AvatarFallback className="rounded-md bg-[#aaa] text-3xl text-white">{settings.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
        <span className="absolute inset-0 grid place-items-center rounded-md bg-black/40 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{t("orgSettings.changePicture" as never)}</span>
      </button>
    </Field>
    <SettingCheck label={t("orgSettings.sidebarIcon" as never)} checked={settings.showSidebarIcon} onCheckedChange={(checked) => update("showSidebarIcon", checked)} />
    <Field label={t("orgSettings.name" as never)}><input value={settings.name} onChange={(event) => update("name", event.target.value)} className={controlClass} /></Field>
    <Field label={t("orgSettings.description" as never)}><textarea rows={5} value={settings.description} onChange={(event) => update("description", event.target.value)} placeholder={t("orgSettings.descriptionPlaceholder" as never)} className={`${controlClass} resize-y`} /></Field>
    <Field label={t("orgSettings.url" as never)}><div className="flex items-center gap-2" dir="ltr"><span className="shrink-0 text-sm text-text2">{origin}/o/</span><input aria-label={t("orgSettings.url" as never)} value={settings.slug} onChange={(event) => update("slug", event.target.value.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, "").replace(/--+/g, "-").replace(/^-+|-+$/g, ""))} className={controlClass} /></div><Link href={`/o/${encodeURIComponent(settings.slug)}`} target="_blank" className="w-fit text-xs text-brand hover:underline" dir="ltr">{origin}/o/{settings.slug}</Link></Field>
  </div>
}

async function compressOrganizationImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext("2d")
  if (!context) throw new Error("canvas unavailable")
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  let blob: Blob | null = null
  for (const quality of [0.84, 0.72, 0.6, 0.48]) {
    blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality))
    if (blob && blob.size <= 450_000) break
  }
  if (!blob || blob.size > 450_000) throw new Error("image too large")
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("invalid image"))
    reader.onerror = () => reject(new Error("invalid image"))
    reader.readAsDataURL(blob!)
  })
}

function SettingCheck({ label, checked, onCheckedChange, description }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void; description?: string }) {
  return <label className="flex cursor-pointer items-start gap-2.5 text-sm text-foreground"><input type="checkbox" checked={checked} onChange={(event) => onCheckedChange(event.target.checked)} className="mt-0.5 size-4 accent-blue-600" /><span>{label}{description && <span className="mt-1 block text-sm text-text2">{description}</span>}</span></label>
}

function MembersSettings({ members, ownerId, currentUserRole, canManageAccess, canInvite, canRemove, roleLabel, onRole, onRemove, invite, setInvite, inviteEmail, setInviteEmail, onInvite, t }: { members: OrgMember[]; ownerId: string; currentUserRole: OrgRole; canManageAccess: boolean; canInvite: boolean; canRemove: boolean; roleLabel: (role: OrgRole) => string; onRole: (id: string, role: OrgRole) => void; onRemove: (id: string) => void; invite: boolean; setInvite: (value: boolean) => void; inviteEmail: string; setInviteEmail: (value: string) => void; onInvite: (event: React.FormEvent<HTMLFormElement>) => void; t: (key: never) => string }) {
  return <div className="flex flex-col gap-5">
    <h2 className="text-lg font-semibold text-foreground">{t("orgSettings.members" as never)}</h2>
    <p className="text-sm text-text2">{members.length} {t("orgSettings.memberCount" as never)}</p>
    <p className="text-xs leading-5 text-text2">{t("orgSettings.roleHint" as never)}</p>
    <div className="flex flex-col gap-2">
      {members.map((member) => <div key={member.id} className="flex min-w-0 items-center gap-3 py-1.5">
        <Avatar className="size-11 shrink-0"><AvatarImage src={member.avatarUrl} alt={member.name} /><AvatarFallback className="bg-brand/80 text-white">{member.name.slice(0, 1)}</AvatarFallback></Avatar>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-foreground">{member.name}</p><p className="truncate text-sm text-text2" dir="ltr">{member.email}</p></div>
        <select aria-label={`${t("orgSettings.role" as never)} — ${member.name}`} value={member.role} disabled={!canManageAccess || member.role === "owner" && (members.length < 2 || currentUserRole !== "owner")} onChange={(event) => onRole(member.id, event.target.value as OrgRole)} className="h-9 max-w-36 rounded-md border border-border bg-background px-2 text-sm text-foreground disabled:cursor-default disabled:opacity-100">
          <option value="owner" disabled={currentUserRole !== "owner"}>{roleLabel("owner")}</option><option value="admin">{roleLabel("admin")}</option><option value="custom">{roleLabel("custom")}</option>
        </select>
        {canRemove && member.id !== ownerId && <button type="button" onClick={() => onRemove(member.id)} aria-label={`${t("orgSettings.remove" as never)} ${member.name}`} className="grid size-9 shrink-0 place-items-center rounded-md text-icon2 hover:bg-bg2 hover:text-destructive"><RemixIcon name="delete-bin-line" className="text-lg" /></button>}
      </div>)}
    </div>
    {canInvite && (invite ? <form onSubmit={onInvite} className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row"><input required type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder={t("orgSettings.emailPlaceholder" as never)} className={`${controlClass} sm:max-w-64`} /><Button type="submit">{t("orgSettings.invite" as never)}</Button><Button type="button" variant="ghost" onClick={() => setInvite(false)}>{t("orgSettings.cancel" as never)}</Button></form> : <Button variant="outline" className="w-fit" onClick={() => setInvite(true)}><RemixIcon name="add-line" />{t("orgSettings.invite" as never)}</Button>)}
  </div>
}

function OptionsSettings({ settings, update, t }: { settings: OrgSettings; update: <K extends keyof OrgSettings>(key: K, value: OrgSettings[K]) => void; t: (key: never) => string }) {
  return <div className="flex flex-col gap-10">
    <section id="org-option-email" className="scroll-mt-6 border-b border-border pb-7"><EmailSettings enabled={settings.createFromEmail} onChange={(value) => update("createFromEmail", value)} t={t} /></section>
    <section id="org-option-notifications" className="scroll-mt-6 border-b border-border pb-7"><NotificationsSettings value={settings.notifications} onChange={(value) => update("notifications", value)} t={t} /></section>
    <section id="org-option-features" className="scroll-mt-6"><FeatureSettings value={settings.features} onChange={(value) => update("features", value)} t={t} /></section>
  </div>
}

function EmailSettings({ enabled, onChange, t }: { enabled: boolean; onChange: (value: boolean) => void; t: (key: never) => string }) {
  return <div className="flex flex-col gap-5"><h2 className="text-lg font-semibold text-foreground">{t("orgSettings.emailToQuire" as never)}</h2><SettingCheck label={t("orgSettings.createFromEmail" as never)} checked={enabled} onCheckedChange={onChange} /></div>
}

function NotificationsSettings({ value, onChange, t }: { value: Record<string, boolean>; onChange: (value: Record<string, boolean>) => void; t: (key: never) => string }) {
  const items = [{ key: "upcoming", label: t("orgSettings.upcoming" as never), description: t("orgSettings.upcomingDesc" as never) }, { key: "comments", label: t("orgSettings.comments" as never) }, { key: "chat", label: t("orgSettings.chat" as never) }]
  return <div className="flex flex-col gap-4"><h2 className="text-lg font-semibold text-foreground">{t("orgSettings.notifications" as never)}</h2><h3 className="text-sm text-text2">{t("orgSettings.notifyMe" as never)}</h3>{items.map((item) => <div key={item.key} className="flex flex-col gap-2"><SettingCheck label={item.label} description={item.description} checked={Boolean(value[item.key])} onCheckedChange={(checked) => onChange({ ...value, [item.key]: checked })} />{(item.key === "comments" || item.key === "chat") && value[item.key] && <div className="ms-6 flex flex-wrap gap-5 text-sm text-foreground"><label className="flex items-center gap-2"><input type="radio" name={`${item.key}-scope`} defaultChecked className="accent-blue-600" />{t("orgSettings.allActivity" as never)}</label><label className="flex items-center gap-2"><input type="radio" name={`${item.key}-scope`} className="accent-blue-600" />{t("orgSettings.mentionsOnly" as never)}</label></div>}</div>)}<label className="mt-2 flex items-center gap-3 text-sm text-foreground">{t("orgSettings.taskActivities" as never)}<select className={`${controlClass} max-w-sm`}><option>{t("orgSettings.allTasks" as never)}</option><option>{t("orgSettings.assignedTasks" as never)}</option></select></label></div>
}

function FeatureSettings({ value, onChange, t }: { value: Record<string, boolean>; onChange: (value: Record<string, boolean>) => void; t: (key: never) => string }) {
  const labels: [string, string, string][] = [["priority", "featurePriority", "featurePriorityDesc"], ["schedule", "featureSchedule", "featureScheduleDesc"], ["assignees", "featureAssignees", "featureAssigneesDesc"], ["status", "featureStatus", "featureStatusDesc"], ["approval", "featureApproval", "featureApprovalDesc"], ["editing", "featureEditing", "featureEditingDesc"], ["moving", "featureMoving", "featureMovingDesc"]]
  return <div className="flex flex-col gap-5"><h2 className="text-lg font-semibold text-foreground">{t("orgSettings.features" as never)}</h2>{labels.map(([key, label, description]) => <SettingCheck key={key} label={t(`orgSettings.${label}` as never)} description={t(`orgSettings.${description}` as never)} checked={Boolean(value[key])} onCheckedChange={(checked) => onChange({ ...value, [key]: checked })} />)}</div>
}

function PropertiesSettings({ properties, onChange, t }: { properties: OrgProperty[]; onChange: (properties: OrgProperty[]) => void; t: (key: never) => string }) {
  const [name, setName] = useState("")
  const [type, setType] = useState<OrgProperty["type"]>("text")

  function addProperty(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = name.trim()
    if (!value || properties.some((property) => property.name.toLocaleLowerCase() === value.toLocaleLowerCase())) return
    onChange([...properties, { id: `property-${Date.now()}`, name: value, type }])
    setName("")
  }

  return <div className="flex flex-col gap-5">
    <div><h2 className="text-lg font-semibold text-foreground">{t("orgSettings.properties" as never)}</h2><p className="mt-1 text-sm text-text2">{t("orgSettings.propertiesHelp" as never)}</p></div>
    {properties.length ? <div className="divide-y divide-border border-y border-border">{properties.map((property) => <div key={property.id} className="flex items-center gap-3 py-3"><span className="min-w-0 flex-1 truncate text-sm text-foreground">{property.name}</span><span className="text-sm text-text2">{t(`orgSettings.property${property.type[0].toUpperCase()}${property.type.slice(1)}` as never)}</span><button type="button" onClick={() => onChange(properties.filter((item) => item.id !== property.id))} aria-label={`${t("orgSettings.remove" as never)} ${property.name}`} className="grid size-8 place-items-center rounded-md text-icon2 hover:bg-bg2 hover:text-destructive"><RemixIcon name="delete-bin-line" /></button></div>)}</div> : <div className="flex min-h-36 flex-col items-center justify-center gap-2 border border-dashed border-border px-4 text-center"><RemixIcon name="list-settings-line" className="text-2xl text-icon2" /><p className="text-sm text-text2">{t("orgSettings.propertyEmpty" as never)}</p></div>}
    <form onSubmit={addProperty} className="flex flex-col gap-2 sm:flex-row"><input required value={name} onChange={(event) => setName(event.target.value)} aria-label={t("orgSettings.propertyName" as never)} placeholder={t("orgSettings.propertyName" as never)} className={`${controlClass} sm:max-w-64`} /><select value={type} onChange={(event) => setType(event.target.value as OrgProperty["type"])} aria-label={t("orgSettings.propertyType" as never)} className={`${controlClass} sm:max-w-44`}><option value="text">{t("orgSettings.propertyText" as never)}</option><option value="date">{t("orgSettings.propertyDate" as never)}</option><option value="number">{t("orgSettings.propertyNumber" as never)}</option></select><Button type="submit" disabled={!name.trim()}><RemixIcon name="add-line" />{t("orgSettings.propertyAdd" as never)}</Button></form>
  </div>
}

function AdvancedSettings({ organization, t }: { organization: Organization; t: (key: never) => string }) {
  return <div className="flex flex-col gap-5">
    <div><h2 className="text-lg font-semibold text-foreground">{t("orgSettings.advanced" as never)}</h2><p className="mt-1 text-sm text-text2">{t("orgSettings.advancedHelp" as never)}</p></div>
    <Field label={t("orgSettings.id" as never)}><input readOnly value={organization.id} dir="ltr" className={`${controlClass} text-text2`} /></Field>
    <Field label={t("orgSettings.createdAt" as never)}><input readOnly value={organization.createdAt} dir="ltr" className={`${controlClass} text-text2`} /></Field>
    <div className="flex items-start gap-2 border-s-2 border-border px-3 py-2 text-sm text-text2"><RemixIcon name="information-line" className="mt-0.5 shrink-0" /><p>{t("orgSettings.advancedLocalOnly" as never)}</p></div>
  </div>
}
