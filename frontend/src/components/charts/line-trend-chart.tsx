import { useEffect, useId, useRef, useState } from "react"

export type TrendSeries = {
  key: string
  /** مقدار CSS رنگ (معمولاً var(--token))، نه هگز خام — رجوع به docs/FRONTEND.md بخش «لایه‌ی رنگی» */
  colorVar: string
  values: number[]
}

const WIDTH = 940
const HEIGHT = 194
const PADDING = { top: 10, right: 4, bottom: 22, left: 28 }
const PLOT_WIDTH = WIDTH - PADDING.left - PADDING.right
const PLOT_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom

/**
 * نمودار خطی چندسری بدون کتابخانه‌ی خارجی (مثل بقیه‌ی چارت‌های این پوشه، با SVG خام).
 * محور y از روی بزرگ‌ترین مقدار همه‌ی سری‌ها به ۵ پله‌ی «گرد» تقسیم می‌شود؛ برچسب‌های محور x
 * فقط هر `labelEvery` نقطه یک‌بار (به‌علاوه‌ی همیشه آخرین نقطه) نشان داده می‌شوند تا شلوغ نشود.
 * تمام متن‌ها داخل همان SVG رسم می‌شوند (نه یک ردیف HTML جدا) تا با تغییر اندازه‌ی واکنش‌گرا
 * دقیقاً زیر همان نقطه‌ی داده بمانند.
 */
export function LineTrendChart({
  series,
  xLabels,
  labelEvery = 4,
}: {
  series: TrendSeries[]
  xLabels: string[]
  labelEvery?: number
}) {
  const pointCount = xLabels.length
  const maxValue = Math.max(1, ...series.flatMap((s) => s.values))
  const step = Math.max(1, Math.ceil(maxValue / 5))
  const ticks = [1, 2, 3, 4, 5].map((i) => step * i)
  const niceMax = step * 5

  const x = (i: number) => PADDING.left + (PLOT_WIDTH * i) / Math.max(1, pointCount - 1)
  const y = (v: number) => PADDING.top + PLOT_HEIGHT * (1 - v / niceMax)

  return (
    <div dir="ltr">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ height: HEIGHT }}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--border)"
              strokeWidth="1"
            />
            <text
              x={PADDING.left - 8}
              y={y(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              style={{ fill: "var(--text3)", fontSize: 10 }}
            >
              {tick}
            </text>
          </g>
        ))}
        <line
          x1={PADDING.left}
          x2={WIDTH - PADDING.right}
          y1={y(0)}
          y2={y(0)}
          stroke="var(--border)"
          strokeWidth="1"
        />

        {series.map((s) => (
          <polyline
            key={s.key}
            fill="none"
            stroke={s.colorVar}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
          />
        ))}

        {xLabels.map((label, i) => {
          if (i % labelEvery !== 0 && i !== pointCount - 1) return null
          const isLast = i === pointCount - 1
          const isFirst = i === 0
          return (
            <text
              key={i}
              x={x(i)}
              y={HEIGHT - 6}
              textAnchor={isFirst ? "start" : isLast ? "end" : "middle"}
              style={{ fill: "var(--text3)", fontSize: 10 }}
            >
              {label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
/** Trend used by project status: a 12-day chart with smooth lines and soft fills. */
export function StatusTrendChart({ series, xLabels, reverse, label }: { series: TrendSeries[]; xLabels: string[]; reverse: boolean; label: string }) {
  const id = useId().replace(/:/g, "")
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(580)
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(entries => setWidth(Math.max(580, Math.round(entries[0].contentRect.width))))
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])
  const plotLeft = 18, plotRight = width - 2, top = 8, bottom = 162
  const step = Math.max(1, Math.ceil(Math.max(1, ...series.flatMap(item => item.values)) / 5))
  const max = step * 5
  const x = (index: number) => plotLeft + (plotRight - plotLeft) * (reverse ? xLabels.length - 1 - index : index) / Math.max(1, xLabels.length - 1)
  const y = (value: number) => bottom - (bottom - top) * value / max
  const pathFor = (values: number[]) => {
    if (!values.length) return ""
    const points = values.map((value, index) => ({ x: x(index), y: y(value) }))
    return `M ${points[0].x} ${points[0].y}` + points.slice(1).map((point, index) => {
      const previous = points[index]
      const middle = (previous.x + point.x) / 2
      return ` C ${middle} ${previous.y}, ${middle} ${point.y}, ${point.x} ${point.y}`
    }).join("")
  }

  return <div dir="ltr" className="overflow-x-auto" ref={containerRef}>
    <svg viewBox={`0 0 ${width} 194`} role="img" aria-label={label} className="h-[194px] min-w-[580px] w-full">
      <defs>{series.map((item, index) => <linearGradient key={item.key} id={`${id}-${index}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={item.colorVar} stopOpacity="0.18" /><stop offset="100%" stopColor={item.colorVar} stopOpacity="0" /></linearGradient>)}</defs>
      {[0, 1, 2, 3, 4, 5].map(index => {
        const value = index * step
        return <g key={value}><line x1={plotLeft} x2={plotRight} y1={y(value)} y2={y(value)} stroke="var(--border)" strokeWidth="1" /><text x={plotLeft - 7} y={y(value)} textAnchor="end" dominantBaseline="middle" fill="var(--text2)" fontSize="11">{value || ""}</text></g>
      })}
      {series.map((item, index) => {
        const path = pathFor(item.values)
        if (!path) return null
        return <g key={item.key}><path d={`${path} L ${x(item.values.length - 1)} ${bottom} L ${x(0)} ${bottom} Z`} fill={`url(#${id}-${index})`} /><path d={path} fill="none" stroke={item.colorVar} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />{item.values.map((value, point) => <circle key={point} cx={x(point)} cy={y(value)} r="6" fill="transparent"><title>{`${xLabels[point]}: ${value}`}</title></circle>)}</g>
      })}
      {xLabels.map((date, index) => <text key={index} x={x(index)} y="185" textAnchor={index === 0 ? (reverse ? "end" : "start") : index === xLabels.length - 1 ? (reverse ? "start" : "end") : "middle"} fill="var(--text2)" fontSize="10">{date}</text>)}
    </svg>
  </div>
}
