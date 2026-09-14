"use client"

import { ActivityHeatmap } from "@/components/charts/activity-heatmap"
import { StatusDonutChart } from "@/components/charts/status-donut-chart"
import { SectionBox, SectionTitle } from "@/components/layout/section"
import { StatTile } from "@/components/layout/stat-tile"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useT } from "@/components/providers/locale-provider"
import type { Project } from "@/lib/api/types"

/** تقویم ماهانه‌ی ساده (بدون تراز واقعی روز هفته) که فقط روزهای دارای سررسید را نشانه‌گذاری می‌کند. */
function DeadlineCalendar({ dueDays }: { dueDays: number[] }) {
  const days = Array.from({ length: 30 }, (_, i) => i + 1)
  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((day) => (
        <div key={day} className="flex flex-col items-center gap-1 rounded-md py-1.5 text-xs text-text2">
          <span>{day}</span>
          <span className={`size-1 rounded-full ${dueDays.includes(day) ? "bg-brand" : "bg-transparent"}`} />
        </div>
      ))}
    </div>
  )
}

function dayOfMonth(date: string) {
  const day = Number(date.split("/").pop())
  return Number.isNaN(day) ? null : day
}

export function ProjectOverview({ project }: { project: Project }) {
  const t = useT()
  const dueDays = project.tasks
    .map((task) => task.dueDate)
    .filter((date): date is string => Boolean(date))
    .map(dayOfMonth)
    .filter((day): day is number => day !== null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <SectionTitle>{t("project.timeline")}</SectionTitle>
        <p className="text-sm text-text2">
          {project.startDate} — {project.endDate}
        </p>
        <button
          type="button"
          className="flex w-fit items-center gap-1.5 rounded-md py-1.5 text-sm text-text2 hover:text-foreground"
        >
          <RemixIcon name="attachment-line" className="text-base" />
          {t("project.addAttachment")}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <SectionTitle>{t("project.health")}</SectionTitle>
        <SectionBox>
          <div className="flex gap-2">
            <StatTile label={t("health.active")} value={project.health.active} />
            <StatTile label={t("health.completed")} value={project.health.completed} />
            <StatTile label={t("health.dueThisPeriod")} value={project.health.dueInPeriod} />
            <StatTile label={t("health.overdue")} value={project.health.overdue} />
          </div>
        </SectionBox>
      </div>

      <div className="flex flex-col gap-2">
        <SectionTitle>{t("project.statusDistribution")}</SectionTitle>
        <SectionBox>
          <StatusDonutChart
            segments={[
              { label: t("status.todo"), value: project.statusDistribution.todo, colorVar: "var(--text3)" },
              { label: t("status.inProgress"), value: project.statusDistribution.inProgress, colorVar: "var(--warning)" },
              { label: t("status.completed"), value: project.statusDistribution.completed, colorVar: "var(--success)" },
            ]}
          />
        </SectionBox>
      </div>

      <div className="flex flex-col gap-2">
        <SectionTitle>{t("project.deadlineCalendar")}</SectionTitle>
        <SectionBox>
          <DeadlineCalendar dueDays={dueDays} />
        </SectionBox>
      </div>

      <div className="flex flex-col gap-2">
        <SectionTitle>{t("project.memberActivity")}</SectionTitle>
        <SectionBox>
          <ActivityHeatmap data={project.activity} />
        </SectionBox>
      </div>
    </div>
  )
}
