"use client"

import { LEVEL_CLASSES } from "@/components/charts/activity-heatmap"
import { MemberActivityGrid } from "@/components/charts/member-activity-grid"
import { OverviewCard } from "@/components/layout/section"
import { useLocale } from "@/components/providers/locale-provider"
import type { Member } from "@/lib/api/types"
import { buildDateLabels } from "./project-health"

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
  const dateLabels = buildDateLabels(locale, length)

  return (
    <OverviewCard
      title={t("project.memberActivity")}
      subtitle={`${members.length} ${t("members.membersUnit")}`}
    >
      <div className="flex flex-col gap-3">
        {members.length > 0 ? (
          <MemberActivityGrid members={members} dateLabels={dateLabels} />
        ) : (
          <p className="py-4 text-center text-sm text-text3">{t("project.noMembers")}</p>
        )}

        <div className="flex items-center justify-end gap-2 text-xs text-text2">
          <span>
            {t("project.activityUpdatedAt")} {updatedAt}
          </span>
          <span>·</span>
          <span>{t("activity.less")}</span>
          <div className="flex items-center gap-1">
            {LEVEL_CLASSES.map((cls, i) => (
              <span key={i} className={`size-3 rounded-sm ${cls}`} />
            ))}
          </div>
          <span>{t("activity.more")}</span>
        </div>
      </div>
    </OverviewCard>
  )
}
