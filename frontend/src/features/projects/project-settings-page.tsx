"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/navigation/page-header"
import { RemixIcon } from "@/components/ui/remix-icon"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useT } from "@/components/providers/locale-provider"
import { SettingsGroup, SettingsLinkRow, SettingsToggleRow } from "@/features/account/settings-row"
import type { TranslationKey } from "@/lib/i18n/dictionary"
import type { Member, Project } from "@/lib/api/types"

const ROLE_LABEL_KEY: Record<Member["role"], TranslationKey> = {
  admin: "members.roleAdmin",
  member: "members.roleMember",
}

type OptionKey = "assignees" | "favorite" | "newTags" | "rtl"

/**
 * صفحه‌ی تنظیمات پروژه — سه تب کلی/اعضا/گزینه‌ها (طبق طرح Figma settings صفحه‌ی پروژه‌ی
 * Quire، با ساختار پیاده‌سازی‌شده مطابق سبک این پروژه: `Tabs` عمودی مثل بقیه‌ی جاهای اپ،
 * ردیف‌های `SettingsGroup`/`SettingsToggleRow` مثل صفحه‌ی حساب کاربری). هیچ‌کدام از تغییرها
 * واقعاً ذخیره نمی‌شوند (فقط state محلی همین کامپوننت) — مثل بقیه‌ی فرم‌های این فاز.
 */
export function ProjectSettingsPage({ project }: { project: Project }) {
  const t = useT()
  const [tab, setTab] = useState("general")

  return (
    <div className="flex flex-1 flex-col bg-background">
      <PageHeader title={t("projectSettings.title")} subtitle={project.name} />

      <div className="mx-auto w-full max-w-4xl flex-1 p-4 lg:p-8">
        <Tabs value={tab} onValueChange={(value) => setTab(value as string)} orientation="vertical" className="items-start gap-6 lg:gap-10">
          <TabsList variant="line" className="w-28 shrink-0 lg:w-44">
            <TabsTrigger value="general">{t("projectSettings.tabGeneral")}</TabsTrigger>
            <TabsTrigger value="members">{t("projectSettings.tabMembers")}</TabsTrigger>
            <TabsTrigger value="options">{t("projectSettings.tabOptions")}</TabsTrigger>
          </TabsList>

          <div className="min-w-0 flex-1">
            <TabsContent value="general">
              <GeneralTab project={project} />
            </TabsContent>
            <TabsContent value="members">
              <MembersTab members={project.members} />
            </TabsContent>
            <TabsContent value="options">
              <OptionsTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

function GeneralTab({ project }: { project: Project }) {
  const t = useT()
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? "")

  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-base font-medium text-foreground">{t("projectSettings.profile")}</h3>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-text2">{t("projectSettings.picture")}</label>
        <Avatar size="lg" className="size-20">
          <AvatarFallback className="text-2xl">{name.slice(0, 1)}</AvatarFallback>
        </Avatar>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-text2">{t("projectSettings.name")}</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm text-foreground outline-none placeholder:text-text3"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-text2">{t("projectSettings.description")}</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("projectSettings.descriptionPlaceholder")}
          className="w-full resize-none rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm text-foreground outline-none placeholder:text-text3"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-text2">{t("projectSettings.projectUrl")}</label>
        <div className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-sm text-text2" dir="ltr">
          <span className="text-text3">quire.app/w/</span>
          <span className="min-w-0 flex-1 truncate text-foreground">{project.id}</span>
        </div>
      </div>
    </div>
  )
}

function MembersTab({ members: initialMembers }: { members: Member[] }) {
  const t = useT()
  const [members, setMembers] = useState(initialMembers)

  function setRole(id: string, role: Member["role"]) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)))
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-foreground">{t("projectSettings.tabMembers")}</h3>
        <span className="text-sm text-text2">
          {members.length} {t("projectSettings.membersCount")}
        </span>
      </div>

      <SettingsGroup>
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-2.5 border-b border-border px-3 py-2.5 last:border-b-0">
            <Avatar>
              {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
              <AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-foreground hover:bg-bg2">
                {t(ROLE_LABEL_KEY[member.role])}
                <RemixIcon name="arrow-down-s-line" className="text-sm" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={member.role} onValueChange={(value) => setRole(member.id, value as Member["role"])}>
                  <DropdownMenuRadioItem value="admin" closeOnClick>
                    {t("members.roleAdmin")}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="member" closeOnClick>
                    {t("members.roleMember")}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </SettingsGroup>

      <Button variant="outline" className="w-fit" disabled>
        <RemixIcon name="user-add-line" className="text-base" />
        {t("projectSettings.invite")}
      </Button>

      <SettingsLinkRow icon="logout-box-r-line" label={t("projectSettings.leaveProject")} destructive />
    </div>
  )
}

function OptionsTab() {
  const t = useT()
  const [options, setOptions] = useState<Record<OptionKey, boolean>>({
    assignees: true,
    favorite: true,
    newTags: true,
    rtl: true,
  })

  function toggle(key: OptionKey) {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-base font-medium text-foreground">{t("projectSettings.tabOptions")}</h3>

      <SettingsGroup>
        <SettingsToggleRow
          icon="user-shared-line"
          label={t("projectSettings.optionAssignees")}
          description={t("projectSettings.optionAssigneesDesc")}
          control={<Switch checked={options.assignees} onCheckedChange={() => toggle("assignees")} />}
        />
        <SettingsToggleRow
          icon="heart-line"
          label={t("projectSettings.optionFavorite")}
          description={t("projectSettings.optionFavoriteDesc")}
          control={<Switch checked={options.favorite} onCheckedChange={() => toggle("favorite")} />}
        />
        <SettingsToggleRow
          icon="price-tag-3-line"
          label={t("projectSettings.optionNewTags")}
          description={t("projectSettings.optionNewTagsDesc")}
          control={<Switch checked={options.newTags} onCheckedChange={() => toggle("newTags")} />}
        />
        <SettingsToggleRow
          icon="direction-line"
          label={t("projectSettings.optionRtl")}
          description={t("projectSettings.optionRtlDesc")}
          control={<Switch checked={options.rtl} onCheckedChange={() => toggle("rtl")} />}
        />
      </SettingsGroup>

      <SettingsGroup>
        <SettingsLinkRow icon="lock-line" label={t("projectSettings.visibility")} value={t("projectSettings.visibilityPrivate")} />
      </SettingsGroup>

      <SettingsGroup>
        <SettingsLinkRow icon="file-copy-line" label={t("projectSettings.duplicateProject")} />
        <SettingsLinkRow icon="archive-line" label={t("projectSettings.archiveProject")} />
        <SettingsLinkRow icon="delete-bin-line" label={t("projectSettings.deleteProject")} destructive />
      </SettingsGroup>
    </div>
  )
}
