"use client"

import Link from "next/link"
import { ActivityHeatmap } from "@/components/charts/activity-heatmap"
import { SectionBox, SectionTitle } from "@/components/layout/section"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useT } from "@/components/providers/locale-provider"
import type { TranslationKey } from "@/lib/i18n/dictionary"
import type { PublicUser } from "@/lib/api/types"

const ROLE_KEY: Record<PublicUser["role"], TranslationKey> = {
  admin: "members.roleAdmin",
  member: "members.roleMember",
}

/**
 * پروفایل عمومیِ یک کاربر (نه لزوماً کاربر واردشده) — فعلاً فقط از کلیک روی نام کاربر در
 * «اعلان‌ها» قابل‌دسترس است. رجوع به README.md همین پوشه.
 */
export function UserProfile({ user }: { user: PublicUser }) {
  const t = useT()

  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-start gap-3 rounded-md border border-border bg-background p-3">
        <Avatar size="lg">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
          <AvatarFallback>{user.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-medium text-foreground">{user.name}</p>
          <p className="text-xs text-text2">{t(ROLE_KEY[user.role])}</p>
          {user.email && (
            <p dir="ltr" className="mt-1 truncate text-start text-xs text-text2">
              {user.email}
            </p>
          )}
          {user.bio && <p className="mt-1 text-xs text-text2">{user.bio}</p>}
        </div>
      </section>

      {user.organizations.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionTitle>{t("user.organizations")}</SectionTitle>
          <SectionBox>
            <div className="flex flex-col">
              {user.organizations.map((org, index) => (
                <Link
                  key={org.id}
                  href={`/home/organizations/${org.id}`}
                  className={`py-2 text-sm text-foreground hover:text-brand ${index > 0 ? "border-t border-border" : ""}`}
                >
                  {org.name}
                </Link>
              ))}
            </div>
          </SectionBox>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <SectionTitle>{t("user.activity")}</SectionTitle>
        <SectionBox>
          <ActivityHeatmap data={user.activity} />
        </SectionBox>
      </section>
    </div>
  )
}
