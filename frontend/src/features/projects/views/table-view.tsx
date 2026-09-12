import { PRIORITY_LABEL, PriorityDot, STATUS_LABEL } from "@/features/projects/task-display"
import type { Task } from "@/lib/api/types"

const CELL = "border-s border-border px-2.5 py-2 last:border-s-0"

/** نمای جدولی: جدول واقعی با هدر ستون‌ها و بوردر بین همه‌ی سلول‌ها. */
export function TableView({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return <p className="py-8 text-center text-sm text-text2">تسکی وجود ندارد.</p>
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-background">
      <table className="w-full min-w-125 border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-bg2 text-xs text-text2">
            <th className={`${CELL} w-8 text-center font-normal`} title="اولویت">
              <span className="sr-only">اولویت</span>
            </th>
            <th className={`${CELL} w-16 text-start font-normal`}>شناسه</th>
            <th className={`${CELL} text-start font-normal`}>عنوان</th>
            <th className={`${CELL} w-32 text-start font-normal`}>مسئول</th>
            <th className={`${CELL} w-28 text-start font-normal`}>سررسید</th>
            <th className={`${CELL} w-24 text-start font-normal`}>وضعیت</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-b border-border last:border-b-0 hover:bg-bg2">
              <td className={`${CELL} text-center`}>
                <span className="inline-flex align-middle">
                  <PriorityDot priority={task.priority} />
                </span>
              </td>
              <td className={`${CELL} text-xs text-text3`}>{task.displayId}</td>
              <td className={`${CELL} text-foreground`}>{task.title}</td>
              <td className={`${CELL} text-xs text-text2`}>{task.assigneeName ?? "—"}</td>
              <td className={`${CELL} text-xs text-text2`}>{task.dueDate ?? "—"}</td>
              <td className={`${CELL} text-xs text-text2`} title={PRIORITY_LABEL[task.priority]}>
                {STATUS_LABEL[task.status]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
