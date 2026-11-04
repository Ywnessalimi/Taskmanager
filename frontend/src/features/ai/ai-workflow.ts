import { backendRequest } from "@/lib/api/backend-client"
import { createTask } from "@/lib/api/tasks"
import { saveLocalTicket } from "@/features/tickets/local-created-tickets"
import { getCurrentUser } from "@/lib/api/users"
import type { Task, TaskPriority, TicketSubject, TicketPermission } from "@/lib/api/types"

type Member = { id: string; name: string; avatarUrl?: string }
type Project = { id: string; name: string; organizationName: string; members: Member[] }
export type Context = { projects: Project[]; members: Member[]; tasks: Task[] }
type TaskChanges = { title?: string; status?: Task["status"]; priority?: TaskPriority; description?: string; dueDate?: string | null; assigneeNames?: string[] }
type EditProposal = { type: "edit_task"; taskId: string; original: Task; changes: TaskChanges }
export type Proposal = { type: "task" | "ticket"; title: string; projectId: string | null; assigneeId: string | null; priority: TaskPriority; description: string; dueDate: string | null; subject: TicketSubject; permissionIds: TicketPermission[] } | EditProposal
export type Action = Proposal | { type: "report"; memberId: string }

export async function loadContext(): Promise<Context> {
  const [projects, tasks] = await Promise.all([backendRequest<Project[]>("/projects"), backendRequest<Task[]>("/tasks")])
  const members = Array.from(new Map(projects.flatMap(p => (p.members ?? []).map(m => [m.id, m] as const))).values())
  return { projects, members, tasks }
}

export function contextText(context: Context, query = ""): string {
  const result: Array<{ id: string; name: string; organization: string; members: Array<{ id: string; name: string }> }> = []
  for (const p of context.projects) {
    const candidate = { id: p.id, name: p.name, organization: p.organizationName, members: (p.members ?? []).map(m => ({ id: m.id, name: m.name })) }
    if (JSON.stringify([...result, candidate]).length > 2200) break
    result.push(candidate)
  }
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length >= 3)
  const candidates = [...context.tasks].sort((a, b) => {
    const score = (task: Task) => words.filter(w => `${task.title} ${task.displayId} ${task.id}`.toLowerCase().includes(w)).length
    return score(b) - score(a)
  })
  const tasks: Array<{ id: string; displayId: string; title: string; projectId?: string }> = []
  for (const task of candidates) {
    const candidate = { id: task.id, displayId: task.displayId, title: task.title, projectId: task.projectId }
    if (JSON.stringify({ projects: result, tasks: [...tasks, candidate] }).length > 3500) break
    tasks.push(candidate)
  }
  return JSON.stringify({ projects: result, tasks, incomplete: tasks.length < context.tasks.length || result.length < context.projects.length })
}

export function parseReply(reply: string, context: Context): { text: string; action?: Action } {
  const match = reply.match(/```quire-action\s*([\s\S]*?)```/i)
  const text = reply.replace(/```quire-action\s*[\s\S]*?```/gi, "").trim()
  if (!match) return { text }
  try {
    const value: unknown = JSON.parse(match[1])
    if (!value || typeof value !== "object") return { text }
    const v = value as Record<string, unknown>
    if (v.type === "report" && typeof v.memberId === "string" && context.members.some(m => m.id === v.memberId)) return { text, action: { type: "report", memberId: v.memberId } }
    if (v.type === "edit_task") {
      const task = context.tasks.find(item => item.id === v.taskId)
      if (!task || !v.changes || typeof v.changes !== "object" || Array.isArray(v.changes)) return { text }
      const input = { ...(v.changes as Record<string, unknown>) }
      if ("assigneeIds" in input) {
        const project = context.projects.find(item => item.id === task.projectId)
        if (!project || !Array.isArray(input.assigneeIds) || !input.assigneeIds.every(id => typeof id === "string" && project.members.some(member => member.id === id))) return { text }
        input.assigneeNames = input.assigneeIds.map(id => project.members.find(member => member.id === id)!.name)
        delete input.assigneeIds
      }
      const keys = Object.keys(input)
      if (!keys.length || keys.some(key => !["title", "status", "priority", "description", "dueDate", "assigneeNames"].includes(key))) return { text }
      if ("assigneeNames" in input && (!Array.isArray(input.assigneeNames) || !context.projects.find(item => item.id === task.projectId)?.members || !input.assigneeNames.every(name => typeof name === "string" && context.projects.find(item => item.id === task.projectId)!.members.some(member => member.name === name)))) return { text }
      if ("title" in input && (typeof input.title !== "string" || !input.title.trim() || input.title.length > 200)) return { text }
      if ("description" in input && (typeof input.description !== "string" || input.description.length > 6000)) return { text }
      if ("status" in input && !["todo", "in-progress", "completed"].includes(input.status as string)) return { text }
      if ("priority" in input && !["none", "low", "medium", "high", "urgent"].includes(input.priority as string)) return { text }
      if ("dueDate" in input && input.dueDate !== null && (typeof input.dueDate !== "string" || !/^1[34]\d\d\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/.test(input.dueDate) || (Number(input.dueDate.slice(5, 7)) > 6 && Number(input.dueDate.slice(8, 10)) > 30))) return { text }
      return { text, action: { type: "edit_task", taskId: task.id, original: task, changes: input as TaskChanges } }
    }
    if (v.type !== "task" && v.type !== "ticket") return { text }
    if (typeof v.title !== "string" || !v.title.trim() || v.title.length > 200) return { text }
    const project = typeof v.projectId === "string" ? context.projects.find(p => p.id === v.projectId) : undefined
    if ((v.type === "task" && !project) || (v.projectId != null && !project)) return { text }
    const member = typeof v.assigneeId === "string" ? (project?.members ?? context.members).find(m => m.id === v.assigneeId) : undefined
    if (v.assigneeId != null && !member) return { text }
    const priorities: TaskPriority[] = ["none", "low", "medium", "high", "urgent"]
    if (!priorities.includes(v.priority as TaskPriority)) return { text }
    if (v.dueDate != null && (typeof v.dueDate !== "string" || !/^1[34]\d\d\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/.test(v.dueDate) || (Number(v.dueDate.slice(5, 7)) > 6 && Number(v.dueDate.slice(8, 10)) > 30))) return { text }
    const subjects: TicketSubject[] = ["general", "hr", "purchasing", "warehouse"]
    const permissions: TicketPermission[] = ["salary-payment", "purchase", "warehouse-release", "other"]
    if (v.type === "ticket" && (!subjects.includes(v.subject as TicketSubject) || !Array.isArray(v.permissionIds) || !v.permissionIds.every(p => permissions.includes(p)))) return { text }
    return { text, action: { type: v.type, title: v.title.trim(), projectId: project?.id ?? null, assigneeId: member?.id ?? null, priority: v.priority as TaskPriority, description: typeof v.description === "string" ? v.description.slice(0, 6000) : "", dueDate: v.type === "task" && typeof v.dueDate === "string" ? v.dueDate : null, subject: v.type === "ticket" ? v.subject as TicketSubject : "general", permissionIds: v.type === "ticket" ? v.permissionIds as TicketPermission[] : [] } }
  } catch { return { text } }
}

export async function executeProposal(proposal: Proposal, context: Context) {
  if (proposal.type === "edit_task") {
    const current = await backendRequest<Task>(`/tasks/${encodeURIComponent(proposal.taskId)}`)
    if (current.projectId !== proposal.original.projectId || Object.keys(proposal.changes).some(key => JSON.stringify(current[key as keyof Task] ?? null) !== JSON.stringify(proposal.original[key as keyof Task] ?? null))) throw new Error("task_changed")
    await backendRequest<Task>(`/tasks/${encodeURIComponent(proposal.taskId)}`, { method: "PATCH", body: JSON.stringify(proposal.changes) })
    return
  }
  const member = context.members.find(m => m.id === proposal.assigneeId)
  if (proposal.type === "task" && proposal.projectId) {
    await createTask({ title: proposal.title, projectId: proposal.projectId, assigneeNames: member ? [member.name] : [], priority: proposal.priority, tags: [], description: proposal.description, dueDate: proposal.dueDate ?? undefined })
  } else if (proposal.type === "ticket") {
    const user = await getCurrentUser()
    await saveLocalTicket(crypto.randomUUID(), { title: proposal.title, projectId: proposal.projectId ?? undefined, assigneeId: member?.id, assigneeName: member?.name, assigneeAvatarUrl: member?.avatarUrl, priority: proposal.priority, description: proposal.description, subject: proposal.subject, status: "todo", permissionIds: proposal.permissionIds, createdById: user.id, createdByName: user.name })
  } else throw new Error("Invalid proposal")
}

export async function memberReport(memberId: string, context: Context, fa: boolean): Promise<string> {
  const member = context.members.find(m => m.id === memberId)
  if (!member) throw new Error("Unknown member")
  if (context.members.filter(m => m.name === member.name).length > 1) return fa ? `برای «${member.name}» چند حساب هم‌نام وجود دارد و مسئول تسک‌ها با نام ذخیره شده است؛ گزارش قابل اتکا نیست.` : `Several accounts share the name ${member.name}. Tasks store assignees by name, so this report would be unreliable.`
  const tasks = await backendRequest<Task[]>("/tasks")
  const mine = tasks.filter(t => t.assigneeNames?.includes(member.name))
  const count = (status: Task["status"]) => mine.filter(t => t.status === status).length
  return fa ? `### گزارش ${member.name}\n\n| شاخص | تعداد |\n| --- | ---: |\n| تسک‌های اصلی قابل‌دسترسی | ${mine.length} |\n| انجام‌نشده | ${count("todo")} |\n| در حال انجام | ${count("in-progress")} |\n| تکمیل‌شده | ${count("completed")} |\n\nاین گزارش وضعیت فعلی تسک‌های اصلی قابل‌دسترسی شما را نشان می‌دهد و زیرتسک‌ها را نمی‌شمارد. زمان هر تسک بین مسئولان تفکیک نشده است.` : `### Report for ${member.name}\n\n| Metric | Count |\n| --- | ---: |\n| Accessible top-level tasks | ${mine.length} |\n| To do | ${count("todo")} |\n| In progress | ${count("in-progress")} |\n| Completed | ${count("completed")} |\n\nThis shows current accessible top-level tasks and excludes subtasks. Time is not separated by assignee.`
}
