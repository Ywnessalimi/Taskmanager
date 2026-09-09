/** سطح ۰ = طوسی (هیچ فعالیتی)، سطح‌های ۱ تا ۴ = شدت رنگ brand به‌ترتیب کم‌رنگ‌تر تا پررنگ‌تر (کار بیشتر) */
const LEVEL_CLASSES = ["bg-bg3", "bg-brand/25", "bg-brand/50", "bg-brand/75", "bg-brand"]

/**
 * نسخه‌ی تک‌ردیفی فعالیت روزانه با مستطیل‌های عمودی باریک (به‌جای گرید مربعی ActivityHeatmap)
 * تا تعداد روز بیشتری در عرض یک ردیف (مثل صفحه‌ی سازمان) جا شود.
 */
export function ActivityBarRow({ activity }: { activity: number[] }) {
  return (
    <div className="flex items-center gap-[3px]">
      {activity.map((level, i) => (
        <span
          key={i}
          className={`h-5 w-1.5 shrink-0 rounded-[1px] ${LEVEL_CLASSES[Math.min(Math.max(level, 0), 4)]}`}
        />
      ))}
    </div>
  )
}
