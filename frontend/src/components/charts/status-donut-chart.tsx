export type StatusDonutSegment = {
  label: string
  value: number
  /** مقدار CSS رنگ (معمولاً var(--token))، نه هگز خام — رجوع به docs/FRONTEND.md بخش «لایه‌ی رنگی» */
  colorVar: string
}

/**
 * چارت دایره‌ای ساده (Task Status Distribution) بدون کتابخانه‌ی خارجی — با SVG stroke-dasharray.
 */
export function StatusDonutChart({ segments }: { segments: StatusDonutSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  const radius = 40
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="size-24 shrink-0 -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--bg2)" strokeWidth="14" />
        {total > 0 &&
          segments.map((segment) => {
            const dash = (segment.value / total) * circumference
            const dashOffset = -offset
            offset += dash
            return (
              <circle
                key={segment.label}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={segment.colorVar}
                strokeWidth="14"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={dashOffset}
              />
            )
          })}
      </svg>
      <ul className="flex flex-col gap-1.5">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-1.5 text-xs text-text2">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: segment.colorVar }} />
            {segment.label} · {segment.value}
          </li>
        ))}
      </ul>
    </div>
  )
}
