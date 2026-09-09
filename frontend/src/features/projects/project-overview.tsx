import { ActivityHeatmap } from "@/components/charts/activity-heatmap"
import { StatusDonutChart } from "@/components/charts/status-donut-chart"
import { SectionBox, SectionTitle } from "@/components/layout/section"
import { RemixIcon } from "@/components/ui/remix-icon"
import type { Project } from "@/lib/api/types"

function HealthStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 rounded-md bg-bg2 py-3">
      <span className="text-base font-medium text-foreground">{value}</span>
      <span className="text-xs text-text2">{label}</span>
    </div>
  )
}

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
  const dueDays = project.tasks
    .map((task) => task.dueDate)
    .filter((date): date is string => Boolean(date))
    .map(dayOfMonth)
    .filter((day): day is number => day !== null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <SectionTitle>بازه‌ی زمانی پروژه</SectionTitle>
        <p className="text-sm text-text2">
          {project.startDate} تا {project.endDate}
        </p>
        <button
          type="button"
          className="flex w-fit items-center gap-1.5 rounded-md py-1.5 text-sm text-text2 hover:text-foreground"
        >
          <RemixIcon name="attachment-line" className="text-base" />
          افزودن پیوست
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <SectionTitle>سلامت پروژه</SectionTitle>
        <SectionBox>
          <div className="flex gap-2">
            <HealthStat label="فعال" value={project.health.active} />
            <HealthStat label="انجام‌شده" value={project.health.completed} />
            <HealthStat label="سررسید این بازه" value={project.health.dueInPeriod} />
            <HealthStat label="عقب‌افتاده" value={project.health.overdue} />
          </div>
        </SectionBox>
      </div>

      <div className="flex flex-col gap-2">
        <SectionTitle>پراکندگی وضعیت تسک‌ها</SectionTitle>
        <SectionBox>
          <StatusDonutChart
            segments={[
              { label: "در انتظار", value: project.statusDistribution.todo, colorVar: "var(--text3)" },
              { label: "در حال انجام", value: project.statusDistribution.inProgress, colorVar: "var(--warning)" },
              { label: "انجام‌شده", value: project.statusDistribution.completed, colorVar: "var(--success)" },
            ]}
          />
        </SectionBox>
      </div>

      <div className="flex flex-col gap-2">
        <SectionTitle>تقویم سررسیدها</SectionTitle>
        <SectionBox>
          <DeadlineCalendar dueDays={dueDays} />
        </SectionBox>
      </div>

      <div className="flex flex-col gap-2">
        <SectionTitle>فعالیت اعضا</SectionTitle>
        <SectionBox>
          <ActivityHeatmap data={project.activity} />
        </SectionBox>
      </div>
    </div>
  )
}
