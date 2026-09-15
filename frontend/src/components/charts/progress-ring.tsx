/**
 * حلقه‌ی پیشرفت کوچک تک‌مقداری (بدون کتابخانه‌ی خارجی، با همان تکنیک SVG stroke-dasharray
 * که `StatusDonutChart` استفاده می‌کند) — برای نمایش درصد پیشرفت هر پروژه در `WorkspaceList`.
 */
export function ProgressRing({ percent, className = "size-4" }: { percent: number; className?: string }) {
  const clamped = Math.min(100, Math.max(0, percent))
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const dash = (clamped / 100) * circumference

  return (
    <svg viewBox="0 0 100 100" className={`shrink-0 -rotate-90 ${className}`}>
      <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--bg3)" strokeWidth="16" />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="var(--brand)"
        strokeWidth="16"
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeLinecap="round"
      />
    </svg>
  )
}
