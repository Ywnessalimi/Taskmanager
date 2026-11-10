import { currentJalaliDate, isBefore } from "@/lib/jalali"
import { backendRequest } from "./backend-client"
import type { Project, ProjectHealth, ProjectRef, ProjectStatusHistory, Task } from "./types"

type ProjectRecord = Omit<Project, "health" | "statusDistribution" | "tasks" | "activity" | "activityUpdatedAt" | "healthTrend"> & {
  taskCount: number
  completedCount: number
}

type ProjectActivity = { from: string; to: string; timeZone: "UTC"; counts: { actorId: string; day: string; count: number }[] }

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

export function addProjectMember(projectId: string, userId: string): Promise<{ added: boolean }> {
  return backendRequest(`/projects/${encodeURIComponent(projectId)}/members`, { method: "POST", body: JSON.stringify({ userId }) })
}

async function enrichProject(projectRequest: Promise<ProjectRecord>): Promise<Project | undefined> {
  try {
    const project = await projectRequest
    const [tasks, memberActivity, statusHistory] = await Promise.all([
      backendRequest<Task[]>(`/projects/${encodeURIComponent(project.id)}/tasks`),
      backendRequest<ProjectActivity>(`/projects/${encodeURIComponent(project.id)}/member-activity`),
      backendRequest<ProjectStatusHistory>(`/projects/${encodeURIComponent(project.id)}/status-history`),
    ])
    const { health, statusDistribution } = summarizeTasks(tasks)
    const end = Date.parse(memberActivity.to)
    const days = Array.from({ length: 20 }, (_, i) => new Date(end - (20 - i) * 86_400_000).toISOString().slice(0, 10))
    const counts = new Map(memberActivity.counts.map(item => [`${item.actorId}:${item.day}`, item.count]))
    return {
      ...project,
      members: project.members.map(member => ({ ...member, activity: days.map(day => counts.get(`${member.id}:${day}`) ?? 0) })),
      tasks,
      health,
      statusHistory,
      statusDistribution,
      activity: [],
      activityUpdatedAt: new Date().toISOString(),
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
