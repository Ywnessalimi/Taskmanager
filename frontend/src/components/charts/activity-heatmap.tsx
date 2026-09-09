const LEVEL_CLASSES = ["bg-bg2", "bg-bg3", "bg-brand/40", "bg-brand/70", "bg-brand"]

/**
 * نمودار فعالیت روزانه شبیه Contribution Graph گیت‌هاب.
 * `data` آرایه‌ای از سطح فعالیت (۰ تا ۴) است، هر ۷ آیتم یک ستون (هفته) می‌شود.
 * در org overview، project overview و بعداً my-tasks (Portfolio Activity) استفاده می‌شود.
 */
export function ActivityHeatmap({ data }: { data: number[] }) {
  const weeks: number[][] = []
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7))
  }

  return (
    <div className="flex gap-1 overflow-x-auto">
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="flex flex-col gap-1">
          {week.map((level, dayIndex) => (
            <span
              key={dayIndex}
              className={`size-2.5 rounded-[2px] ${LEVEL_CLASSES[Math.min(Math.max(level, 0), 4)]}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
