import { ActivityHeatmap } from "@/components/charts/activity-heatmap"
import { StatusDonutChart } from "@/components/charts/status-donut-chart"
import { SectionBox, SectionTitle } from "@/components/layout/section"
import { StatTile } from "@/components/layout/stat-tile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RemixIcon } from "@/components/ui/remix-icon"
import { PriorityDot } from "@/features/projects/task-display"
import type { CurrentUser, MyTasksOverview as MyTasksOverviewData } from "@/lib/api/types"

/**
 * بخش Overview تب «تسک‌های من» (رجوع به docs/PRODUCT_OVERVIEW.md بخش «تب ۲»):
 * پروفایل کاربر، تسک‌های نیازمند رسیدگی، پراکندگی وضعیت، سلامت تجمیعی و فعالیت شخصی.
 */
export function MyTasksOverview({
  user,
  overview,
}: {
  user: CurrentUser
  overview: MyTasksOverviewData
}) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <div className="flex items-start gap-3 rounded-md border border-border bg-background p-3">
          <Avatar size="lg">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
            <AvatarFallback>{user.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-medium text-foreground">{user.name}</p>
            <p dir="ltr" className="truncate text-start text-xs text-text2">
              {user.email}
            </p>
            {user.bio && <p className="mt-1 text-xs text-text2">{user.bio}</p>}
          </div>
        </div>

        {user.attachments.length > 0 && (
          <SectionBox>
            <div className="flex flex-col">
              {user.attachments.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2.5 border-b border-border py-2 first:pt-0 last:border-b-0 last:pb-0"
                >
                  <RemixIcon name="file-line" className="text-base text-icon2" />
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">{file.name}</span>
                  <span className="shrink-0 text-xs text-text2">{file.sizeLabel}</span>
                </div>
              ))}
            </div>
          </SectionBox>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>نیازمند رسیدگی</SectionTitle>
        <SectionBox>
          {overview.attentionRequired.length === 0 ? (
            <p className="py-2 text-center text-sm text-text2">چیزی نیاز به رسیدگی فوری ندارد.</p>
          ) : (
            <div className="flex flex-col">
              {overview.attentionRequired.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2.5 border-b border-border py-2 first:pt-0 last:border-b-0 last:pb-0"
                >
                  <PriorityDot priority={task.priority} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{task.title}</p>
                    <p className="truncate text-xs text-text2">{task.projectName}</p>
                  </div>
                  {task.dueDate && <span className="shrink-0 text-xs text-destructive">{task.dueDate}</span>}
                </div>
              ))}
            </div>
          )}
        </SectionBox>
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>پراکندگی وضعیت تسک‌ها</SectionTitle>
        <SectionBox>
          <StatusDonutChart
            segments={[
              { label: "در انتظار", value: overview.statusDistribution.todo, colorVar: "var(--text3)" },
              {
                label: "در حال انجام",
                value: overview.statusDistribution.inProgress,
                colorVar: "var(--warning)",
              },
              {
                label: "انجام‌شده",
                value: overview.statusDistribution.completed,
                colorVar: "var(--success)",
              },
            ]}
          />
        </SectionBox>
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>سلامت پروژه‌ها</SectionTitle>
        <SectionBox>
          <div className="flex gap-2">
            <StatTile label="فعال" value={overview.health.active} />
            <StatTile label="انجام‌شده" value={overview.health.completed} />
            <StatTile label="سررسید پیش‌رو" value={overview.health.dueInPeriod} />
            <StatTile label="عقب‌افتاده" value={overview.health.overdue} />
          </div>
        </SectionBox>
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>فعالیت من</SectionTitle>
        <SectionBox>
          <ActivityHeatmap data={overview.activity} />
        </SectionBox>
      </section>
    </div>
  )
}
