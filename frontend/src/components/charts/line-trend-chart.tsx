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
