/**
 * باکس آماری کوچک بخش «سلامت» — در ProjectOverview (سطح پروژه) و MyTasksOverview
 * (تجمیع همه‌ی پروژه‌های کاربر) مشترک است.
 */
export function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 rounded-md bg-bg2 py-3">
      <span className="text-base font-medium text-foreground">{value}</span>
      <span className="text-xs text-text2">{label}</span>
    </div>
  )
}
