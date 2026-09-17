"use client"

import { StatusDonutChart } from "@/components/charts/status-donut-chart"
import { OverviewCard } from "@/components/layout/section"
import { useLocale } from "@/components/providers/locale-provider"
import { DeadlineCalendar } from "./deadline-calendar"
import { MemberActivitySection } from "./member-activity-section"
import { ProjectHealthSection } from "./project-health"
import { ProjectOverviewHeader } from "./project-overview-header"
import type { Project } from "@/lib/api/types"

export function ProjectOverview({ project }: { project: Project }) {
  const { locale, t } = useLocale()
  const statusTotal =
    project.statusDistribution.todo + project.statusDistribution.inProgress + project.statusDistribution.completed

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <ProjectOverviewHeader project={project} locale={locale} />

      <ProjectHealthSection health={project.health} healthTrend={project.healthTrend} />

      {/* دو کارت کنار هم در دسکتاپ (breakpoint `lg` مثل بقیه‌ی اپ)، زیر هم در موبایل — طبق طرح Figma. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DeadlineCalendar tasks={project.tasks} />

        <OverviewCard
          title={t("project.statusDistribution")}
          subtitle={`${statusTotal} ${t("project.tasksTotalSuffix")}`}
        >
          <StatusDonutChart
            size={176}
            variant="pie"
            legendPosition="bottom"
            showValues={false}
            segments={[
              { label: t("status.todo"), value: project.statusDistribution.todo, colorVar: "var(--text3)" },
              {
                label: t("status.inProgress"),
                value: project.statusDistribution.inProgress,
                colorVar: "var(--brand)",
                opacity: 0.5,
              },
              { label: t("status.completed"), value: project.statusDistribution.completed, colorVar: "var(--brand)" },
            ]}
          />
        </OverviewCard>
      </div>

      <MemberActivitySection members={project.members} updatedAt={project.activityUpdatedAt} />
    </div>
  )
}
