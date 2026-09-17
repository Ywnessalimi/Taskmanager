/**
 * نوار پیشرفت قطعه‌قطعه — به‌جای یک میله‌ی یک‌پارچه، چند مستطیل عمودی باریک کنار هم.
 * قطعه‌های پرشده رنگ برند می‌گیرند و قطعه‌های خالی هم پس‌زمینه‌ی خودشان را دارند (خالی
 * نامرئی نیست)، پس کل طول نوار همیشه دیده می‌شود.
 *
 * مصرف‌کننده: ردیف‌های «خلاصه‌ای از پروژه‌ها» در `features/organizations/OrganizationOverview`.
 */
export function SegmentedProgressBar({
  percent,
  segments = 16,
}: {
  percent: number
  segments?: number
}) {
  const clamped = Math.min(100, Math.max(0, percent))
  const filled = Math.round((clamped / 100) * segments)

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className="flex h-4 items-stretch gap-0.5"
    >
      {Array.from({ length: segments }, (_, index) => (
        <span
          key={index}
          className={`w-1 rounded-[2px] ${index < filled ? "bg-brand" : "bg-bg3"}`}
        />
      ))}
    </div>
  )
}
