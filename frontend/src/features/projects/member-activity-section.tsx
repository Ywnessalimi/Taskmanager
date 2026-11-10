"use client"

import { MEMBER_ACTIVITY_LEVEL_CLASSES, MemberActivityGrid } from "@/components/charts/member-activity-grid"
import { useLocale } from "@/components/providers/locale-provider"
import type { Member } from "@/lib/api/types"

/**
 * بخش «فعالیت اعضا» در نمای‌کلی پروژه — طبق طرح Figma «Member Activity»: عنوان/زیرعنوان
 * + شبکه‌ی ردیفی `MemberActivityGrid` + پانوشت (ساعت آخرین به‌روزرسانی + راهنمای رنگ).
 */
export function MemberActivitySection({
  members,
  updatedAt,
}: {
  members: Member[]
  updatedAt: string
}) {
  const { locale, t } = useLocale()
  const length = members[0]?.activity.length ?? 0
  const end = new Date(updatedAt)
  const hasTimestamp = !Number.isNaN(end.getTime())
  const midnight = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() + 1)
  const dateLabels = Array.from({ length }, (_, i) => hasTimestamp ? new Date(midnight - (length - i) * 86_400_000).toLocaleDateString(locale === "fa" ? "fa-IR" : "en-US", { day: "numeric", month: "short", timeZone: "UTC" }) : "")

  return (
    <section className="flex flex-col gap-[18px] rounded-2xl border border-border bg-background p-4">
      <h3 className="text-base font-semibold text-foreground">{t("project.memberActivity")}</h3>
      <div className="flex flex-col gap-4">
        {members.length > 0 ? (
          <MemberActivityGrid members={members} dateLabels={dateLabels} direction={locale === "fa" ? "rtl" : "ltr"} />
        ) : (
          <p className="py-4 text-center text-sm text-text3">{t("project.noMembers")}</p>
        )}

        <p className="text-xs text-text3">{t("projectMembers.activityCoverage")}</p>

        <div className="flex items-center justify-end gap-2 text-xs font-semibold text-text2">
          <span>{t("activity.less")}</span>
          <div className="flex items-center gap-1">
            {MEMBER_ACTIVITY_LEVEL_CLASSES.map((cls, i) => (
              <span key={i} className={`h-3 w-[14px] rounded ${cls}`} />
            ))}
          </div>
          <span>{t("activity.more")}</span>
        </div>
      </div>
    </section>
  )
}
