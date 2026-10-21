import { currentJalaliDate, isBefore } from "@/lib/jalali"
import { backendRequest } from "./backend-client"
import { getCurrentUser } from "./users"
import type { MyTask, MyTasksOverview, ProjectRef, Task } from "./types"

function isMine(task: Task, userName: string): boolean {
  return Boolean(task.assigneeNames?.includes(userName))
}

function withMySubtasks(task: Task, userName: string): Task {
  const subtasks = task.subtasks?.filter((subtask) => isMine(subtask, userName))
  return subtasks && subtasks.length > 0 ? { ...task, subtasks } : { ...task, subtasks: undefined }
}

async function allMyTasks(): Promise<MyTask[]> {
  const [user, tasks, projects] = await Promise.all([
    getCurrentUser(),
    backendRequest<Task[]>("/tasks"),
    backendRequest<ProjectRef[]>("/projects"),
  ])
  const projectById = new Map(projects.map((project) => [project.id, project]))
  return tasks.flatMap((task) => {
    const project = projectById.get(task.projectId ?? "")
    if (!project || !isMine(task, user.name)) return []
    return [{ ...withMySubtasks(task, user.name), projectId: project.id, projectName: project.name }]
  })
}

export async function getMyTasks(): Promise<MyTask[]> {
  return (await allMyTasks()).filter((task) => task.status === "in-progress")
}

export async function getMyTasksOverview(): Promise<MyTasksOverview> {
  const tasks = await allMyTasks()
  const today = currentJalaliDate()
  const statusDistribution = {
    todo: tasks.filter((task) => task.status === "todo").length,
    inProgress: tasks.filter((task) => task.status === "in-progress").length,
    completed: tasks.filter((task) => task.status === "completed").length,
  }
  const overdue = tasks.filter((task) => task.status !== "completed" && task.dueDate && isBefore(task.dueDate, today))
  const attentionRequired = tasks.filter((task) => task.status !== "completed" && (task.priority === "urgent" || overdue.includes(task)))

  return {
    attentionRequired,
    statusDistribution,
    health: {
      active: statusDistribution.todo + statusDistribution.inProgress,
      completed: statusDistribution.completed,
      dueInPeriod: tasks.filter((task) => task.status !== "completed" && task.dueDate && !isBefore(today, task.dueDate)).length,
      overdue: overdue.length,
    },
    activity: [],
  }
}
