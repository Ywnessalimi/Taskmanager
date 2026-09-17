"use client"

import { LineTrendChart, type TrendSeries } from "@/components/charts/line-trend-chart"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useLocale } from "@/components/providers/locale-provider"
import * as jalali from "@/lib/jalali"
import { MOCK_TODAY } from "@/lib/api/mock-data"
import type { ProjectHealth, ProjectHealthTrend } from "@/lib/api/types"
import type { Locale, TranslationKey } from "@/lib/i18n/dictionary"

type Metric = keyof ProjectHealth

const METRIC_ORDER: Metric[] = ["active", "completed", "dueInPeriod", "overdue"]

/**
 * رنگ هر متریک از توکن‌های رنگی *موجود* اپ می‌آید (نه هگز خام طرح Figma): «انجام‌شده»
 * از `--success` و «عقب‌افتاده» از `--destructive` چون این دو دقیقاً همان معنای رایج در
 * بقیه‌ی اپ را دارند؛ «فعال» و «سررسید این بازه» چون توکن معنایی اختصاصی ندارند، از دو
 * رنگ متمایزِ پالت نموداری (`--chart-1` برند، `--chart-4`) استفاده می‌کنند تا از «انجام‌شده»
 * قابل‌تشخیص بمانند. رجوع به README همین پوشه برای توضیح کامل تفاوت با رنگ‌های طرح.
 */
const METRIC_COLOR: Record<Metric, string> = {
  active: "var(--chart-1)",
  completed: "var(--success)",
  dueInPeriod: "var(--chart-4)",
  overdue: "var(--destructive)",
}

const METRIC_LABEL_KEY: Record<Metric, TranslationKey> = {
  active: "health.active",
  completed: "health.completed",
  dueInPeriod: "health.dueThisPeriod",
  overdue: "health.overdue",
}

function gregorianToday(): Date {
  return new Date()
}

/**
 * برچسب هر نقطه‌ی محور x — جلالی در فارسی (هماهنگ با بقیه‌ی اپ)، میلادی واقعی در انگلیسی.
 * export شده چون `MemberActivitySection` (بخش «فعالیت اعضا») هم به همین قالب برچسب نیاز دارد.
 */
export function buildDateLabels(locale: Locale, length: number): string[] {
  if (locale === "fa") {
    const today = jalali.parseDate(MOCK_TODAY)!
    return Array.from({ length }, (_, i) => {
      const d = jalali.addDays(today, i - (length - 1))
      return `${d.day} ${jalali.MONTH_NAMES[d.month - 1]}`
    })
  }
  const today = gregorianToday()
  return Array.from({ length }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() + i - (length - 1))
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  })
}

/** درصد تغییر مقدار اول به آخر سری؛ وقتی مقدار اول صفر است (تقسیم بر صفر)، ۱۰۰٪ افزایش در نظر گرفته می‌شود. */
function percentDelta(values: number[]): number {
  const from = values[0]
  const to = values[values.length - 1]
  if (from === to) return 0
  if (from === 0) return 100
  return Math.round(((to - from) / from) * 100)
}

/**
 * بخش «سلامت پروژه» در `ProjectOverview` — از طرح Figma «AlignUI — Project Health» گرفته
 * شده: ۴ ستون آماری (دایره‌ی رنگی + برچسب + عدد بزرگ + نشان درصد تغییر) به‌علاوه‌ی نمودار
 * روند خطی زیرشان. نسخه‌ی فارسی ترجمه و راست‌چین‌شده‌ی همین کامپوننت است، نه یک کامپوننت
 * جدا — رجوع به README همین پوشه.
 */
export function ProjectHealthSection({
  health,
  healthTrend,
}: {
  health: ProjectHealth
  healthTrend: ProjectHealthTrend
}) {
  const { locale, t } = useLocale()
  const length = healthTrend.active.length
  const xLabels = buildDateLabels(locale, length)

  const series: TrendSeries[] = METRIC_ORDER.map((metric) => ({
    key: metric,
    colorVar: METRIC_COLOR[metric],
    values: healthTrend[metric],
  }))

  return (
    <div className="flex flex-col gap-6 rounded-lg border border-border bg-background p-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-medium text-foreground">{t("project.health")}</h3>
        <div className="h-px w-full bg-border" />
      </div>

      <div className="flex flex-wrap gap-6">
        {METRIC_ORDER.map((metric, index) => (
          <div
            key={metric}
            className={`flex flex-1 items-start gap-1 ${index > 0 ? "border-s border-border ps-6" : ""}`}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: METRIC_COLOR[metric] }}
                />
                <span
                  className={`truncate text-xs text-text2 ${locale === "en" ? "font-medium tracking-wider uppercase" : ""}`}
                >
                  {t(METRIC_LABEL_KEY[metric])}
                </span>
                {metric === "dueInPeriod" && (
                  <RemixIcon
                    name="information-line"
                    className="shrink-0 text-sm text-text3"
                    title={t("health.dueThisPeriodInfo")}
                  />
                )}
              </div>
              <p
                className="text-[32px] leading-none font-semibold"
                style={{ color: metric === "overdue" ? METRIC_COLOR.overdue : "var(--foreground)" }}
              >
                {health[metric]}
              </p>
            </div>
            <PercentBadge metric={metric} values={healthTrend[metric]} />
          </div>
        ))}
      </div>

      <LineTrendChart series={series} xLabels={xLabels} labelEvery={4} />
    </div>
  )
}

function PercentBadge({ metric, values }: { metric: Metric; values: number[] }) {
  const delta = percentDelta(values)
  const color = METRIC_COLOR[metric]
  const isUp = delta >= 0

  return (
    <div
      className="flex shrink-0 items-center gap-0.5 rounded-md px-1 py-0.5 text-xs"
      style={{ backgroundColor: `color-mix(in oklch, ${color}, transparent 90%)`, color }}
    >
      <RemixIcon name={isUp ? "arrow-up-s-line" : "arrow-down-s-line"} className="text-sm" />
      {Math.abs(delta)}%
    </div>
  )
}
