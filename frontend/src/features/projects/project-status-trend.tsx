"use client"

import Image from "next/image"
import { StatusTrendChart, type TrendSeries } from "@/components/charts/line-trend-chart"
import { useLocale } from "@/components/providers/locale-provider"
import type { ProjectStatusHistory } from "@/lib/api/types"

export function ProjectStatusTrend({ history }: { history?: ProjectStatusHistory }) {
  const { locale, t } = useLocale()
  if (!history?.days.length) return null
  const series: TrendSeries[] = [
    { key: "todo", colorVar: "#b9b9b9", values: history.days.map(day => day.todo) },
    { key: "inProgress", colorVar: "var(--chart-1)", values: history.days.map(day => day.inProgress) },
    { key: "completed", colorVar: "var(--success)", values: history.days.map(day => day.completed) },
  ]
  const labels = history.days.map(item => new Date(`${item.day}T00:00:00.000Z`).toLocaleDateString(locale === "fa" ? "fa-IR" : "en-US", { day: "numeric", month: "short", timeZone: "UTC" }))
  const legend = [
    { name: t("status.todo"), image: "/images/projects/status-trend/todo.svg" },
    { name: t("status.inProgress"), image: "/images/projects/status-trend/in-progress.svg" },
    { name: t("status.completed"), image: "/images/projects/status-trend/completed.svg" },
  ]
  return <section aria-label={t("project.statusTrend")} className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-4">
    <h3 className="sr-only">{t("project.statusTrend")}</h3>
    <div className="flex flex-wrap items-center gap-x-[30px] gap-y-2">{legend.map(item => <div key={item.name} className="flex items-center gap-2 text-xs text-foreground"><Image src={item.image} alt="" width={12} height={10} unoptimized /><span>{item.name}</span></div>)}</div>
    <StatusTrendChart series={series} xLabels={labels} reverse={locale === "fa"} label={t("project.statusTrend")} />
    <p className="text-xs text-text3">{t("project.statusTrendCoverage")}</p>
  </section>
}
