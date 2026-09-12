import { isBefore } from "@/lib/jalali"
import { MOCK_CURRENT_USER, MOCK_MY_ACTIVITY, MOCK_PROJECTS, MOCK_TODAY } from "./mock-data"
import type { MyTask, MyTasksOverview, Task } from "./types"

/**
 * تسک‌های تب «تسک‌های من». فعلاً از روی MOCK_PROJECTS محاسبه می‌شود (تخصیص بر اساس نام،
 * چون مدل Mock هنوز assigneeId ندارد). وقتی بک‌اند Django آماده شد، جایگزین
 * GET /api/me/tasks/ می‌شود (رجوع به docs/BACKEND.md بخش ۴) بدون تغییر در کامپوننت‌ها.
 */

/** آیا این تسک (یا یکی از زیرتسک‌هایش) به کاربر تخصیص داده شده؟ */
function isMine(task: Task, userName: string): boolean {
  return task.assigneeName === userName
}

/** تسک را با نگه‌داشتن فقط زیرتسک‌های خودِ کاربر برمی‌گرداند. */
function withMySubtasks(task: Task, userName: string): Task {
  const subtasks = task.subtasks?.filter((sub) => isMine(sub, userName))
  return subtasks && subtasks.length > 0 ? { ...task, subtasks } : { ...task, subtasks: undefined }
}

/** همه‌ی تسک‌های تخصیص‌داده‌شده به کاربر در همه‌ی پروژه‌ها، بدون فیلتر وضعیت. */
function allMyTasks(userName: string): MyTask[] {
  return MOCK_PROJECTS.flatMap((project) =>
    project.tasks
      .filter((task) => isMine(task, userName) || task.subtasks?.some((sub) => isMine(sub, userName)))
      .map((task) => ({
        ...withMySubtasks(task, userName),
        projectId: project.id,
        projectName: project.name,
      }))
  )
}

/**
 * لیست تب «تسک‌های من» — طبق docs/PRODUCT_OVERVIEW.md فقط تسک‌های «در حال انجام» نمایش داده
 * می‌شوند. زیرتسک‌ها برای نمای Tree نگه داشته می‌شوند (بدون فیلتر وضعیت، چون زمینه‌ی تسک والدند).
 */
export async function getMyTasks(): Promise<MyTask[]> {
  return allMyTasks(MOCK_CURRENT_USER.name).filter((task) => task.status === "in-progress")
}

/**
 * داده‌ی تجمیعی Overview. برخلاف لیست، اینجا **همه‌ی** وضعیت‌ها لحاظ می‌شوند —
 * وگرنه نمودار پراکندگی وضعیت و «سلامت» همیشه فقط یک ستون داشتند.
 */
export async function getMyTasksOverview(): Promise<MyTasksOverview> {
  const tasks = allMyTasks(MOCK_CURRENT_USER.name)

  const statusDistribution = {
    todo: tasks.filter((task) => task.status === "todo").length,
    inProgress: tasks.filter((task) => task.status === "in-progress").length,
    completed: tasks.filter((task) => task.status === "completed").length,
  }

  const overdue = tasks.filter(
    (task) => task.status !== "completed" && task.dueDate && isBefore(task.dueDate, MOCK_TODAY)
  )

  const attentionRequired = tasks.filter(
    (task) =>
      task.status !== "completed" &&
      (task.priority === "urgent" || (task.dueDate ? isBefore(task.dueDate, MOCK_TODAY) : false))
  )

  return {
    attentionRequired,
    statusDistribution,
    health: {
      active: statusDistribution.todo + statusDistribution.inProgress,
      completed: statusDistribution.completed,
      dueInPeriod: tasks.filter((task) => task.dueDate && !isBefore(task.dueDate, MOCK_TODAY)).length,
      overdue: overdue.length,
    },
    activity: MOCK_MY_ACTIVITY,
  }
}
