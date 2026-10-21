import { currentJalaliDate, isBefore } from "@/lib/jalali"
import { backendRequest } from "./backend-client"
import type { Project, ProjectHealth, ProjectRef, Task } from "./types"

type ProjectRecord = Omit<Project, "health" | "statusDistribution" | "tasks" | "activity" | "activityUpdatedAt" | "healthTrend"> & {
  taskCount: number
  completedCount: number
}

function summarizeTasks(tasks: Task[]): { health: ProjectHealth; statusDistribution: Project["statusDistribution"] } {
  const statusDistribution = {
    todo: tasks.filter((task) => task.status === "todo").length,
    inProgress: tasks.filter((task) => task.status === "in-progress").length,
    completed: tasks.filter((task) => task.status === "completed").length,
  }
  const today = currentJalaliDate()
  const health = {
    active: statusDistribution.todo + statusDistribution.inProgress,
    completed: statusDistribution.completed,
    dueInPeriod: tasks.filter((task) => task.status !== "completed" && task.dueDate && !isBefore(today, task.dueDate)).length,
    overdue: tasks.filter((task) => task.status !== "completed" && task.dueDate && isBefore(task.dueDate, today)).length,
  }
  return { health, statusDistribution }
}

export async function getProjects(): Promise<ProjectRef[]> {
  const rows = await backendRequest<ProjectRecord[]>("/projects")
  return rows.map((project) => ({
    id: project.id,
    name: project.name,
    slug: project.slug,
    organizationSlug: project.organizationSlug,
    memberIds: project.memberIds,
    progress: project.taskCount ? Math.round((project.completedCount / project.taskCount) * 100) : 0,
  }))
}

async function enrichProject(projectRequest: Promise<ProjectRecord>): Promise<Project | undefined> {
  try {
    const project = await projectRequest
    const tasks = await backendRequest<Task[]>(`/projects/${encodeURIComponent(project.id)}/tasks`)
    const { health, statusDistribution } = summarizeTasks(tasks)
    return {
      ...project,
      tasks,
      health,
      statusDistribution,
      activity: [],
      activityUpdatedAt: "",
    }
  } catch (error) {
    if ((error as { status?: number })?.status === 404) return undefined
    throw error
  }
}

export function getProject(id: string): Promise<Project | undefined> {
  return enrichProject(backendRequest<ProjectRecord>(`/projects/${encodeURIComponent(id)}`))
}

export function getProjectBySlugs(organizationSlug: string, projectSlug: string): Promise<Project | undefined> {
  const decodedOrganizationSlug = decodeURIComponent(organizationSlug)
  const decodedProjectSlug = decodeURIComponent(projectSlug)
  return enrichProject(backendRequest<ProjectRecord>(`/organizations/by-slug/${encodeURIComponent(decodedOrganizationSlug)}/projects/${encodeURIComponent(decodedProjectSlug)}`))
}
