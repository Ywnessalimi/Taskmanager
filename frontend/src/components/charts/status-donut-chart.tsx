export type StatusDonutSegment = {
  label: string
  value: number
  /** مقدار CSS رنگ (معمولاً var(--token))، نه هگز خام — رجوع به docs/FRONTEND.md بخش «لایه‌ی رنگی» */
  colorVar: string
  /** شفافیت رنگ پایه (پیش‌فرض ۱) — برای نمایش شدت‌های مختلف یک رنگ واحد (مثل برند) بدون رنگ هگز جدید */
  opacity?: number
}

/**
 * چارت دایره‌ای ساده بدون کتابخانه‌ی خارجی — با SVG stroke-dasharray. پیش‌فرض‌ها همان رفتار
 * قبلی (دونات با legend کنارش، برای «تسک‌های من») را حفظ می‌کنند؛ `variant="pie"` و
 * `legendPosition="bottom"` برای بازطراحی Figma «Task Status Distribution» در نمای‌کلی پروژه اضافه شده‌اند.
 */
export function StatusDonutChart({
  segments,
  size = 96,
  variant = "donut",
  legendPosition = "side",
  showValues = true,
}: {
  segments: StatusDonutSegment[]
  size?: number
  variant?: "donut" | "pie"
  legendPosition?: "side" | "bottom"
  showValues?: boolean
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  // پای واقعی: با strokeWidth = 2×radius، لبه‌ی داخلی نوار دقیقاً به مرکز می‌رسد (بدون حفره‌ی دونات).
  const radius = variant === "pie" ? 25 : 40
  const strokeWidth = variant === "pie" ? 50 : 14
  const circumference = 2 * Math.PI * radius
  let offset = 0

  const chart = (
    <svg viewBox="0 0 100 100" style={{ width: size, height: size }} className="shrink-0 -rotate-90">
      {(variant === "donut" || total === 0) && (
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--bg2)" strokeWidth={strokeWidth} />
      )}
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
              strokeOpacity={segment.opacity ?? 1}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={dashOffset}
            />
          )
        })}
    </svg>
  )

  const legend = (
    <ul
      className={
        legendPosition === "bottom"
          ? "flex flex-wrap items-center justify-center gap-4"
          : "flex flex-col gap-1.5"
      }
    >
      {segments.map((segment) => (
        <li key={segment.label} className="flex items-center gap-1.5 text-xs text-text2">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: segment.colorVar, opacity: segment.opacity ?? 1 }}
          />
          {segment.label}
          {showValues ? ` · ${segment.value}` : ""}
        </li>
      ))}
    </ul>
  )

  if (legendPosition === "bottom") {
    return (
      <div className="flex flex-col items-center gap-4">
        {chart}
        {legend}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      {chart}
      {legend}
    </div>
  )
}
