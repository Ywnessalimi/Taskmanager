import { backendRequest } from "@/lib/api/backend-client"
import { createTask } from "@/lib/api/tasks"
import { saveLocalTicket } from "@/features/tickets/local-created-tickets"
import { getCurrentUser } from "@/lib/api/users"
import type { Task, TaskPriority } from "@/lib/api/types"

type Member = { id: string; name: string; avatarUrl?: string }
type Project = { id: string; name: string; organizationName: string; members: Member[] }
export type Context = { projects: Project[]; members: Member[] }
export type Proposal = { type: "task" | "ticket"; title: string; projectId: string | null; assigneeId: string | null; priority: TaskPriority; description: string }
export type Action = Proposal | { type: "report"; memberId: string }

export async function loadContext(): Promise<Context> {
  const projects = await backendRequest<Project[]>("/projects")
  const members = Array.from(new Map(projects.flatMap(p => (p.members ?? []).map(m => [m.id, m] as const))).values())
  return { projects, members }
}

export function contextText(context: Context): string {
  return JSON.stringify(context.projects.map(p => ({ id: p.id, name: p.name, organization: p.organizationName, members: (p.members ?? []).map(m => ({ id: m.id, name: m.name })) }))).slice(0, 3500)
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
    if (v.type !== "task" && v.type !== "ticket") return { text }
    if (typeof v.title !== "string" || !v.title.trim() || v.title.length > 200) return { text }
    const project = typeof v.projectId === "string" ? context.projects.find(p => p.id === v.projectId) : undefined
    if ((v.type === "task" && !project) || (v.projectId != null && !project)) return { text }
    const member = typeof v.assigneeId === "string" ? (project?.members ?? context.members).find(m => m.id === v.assigneeId) : undefined
    if (v.assigneeId != null && !member) return { text }
    const priorities: TaskPriority[] = ["none", "low", "medium", "high", "urgent"]
    if (!priorities.includes(v.priority as TaskPriority)) return { text }
    return { text, action: { type: v.type, title: v.title.trim(), projectId: project?.id ?? null, assigneeId: member?.id ?? null, priority: v.priority as TaskPriority, description: typeof v.description === "string" ? v.description.slice(0, 6000) : "" } }
  } catch { return { text } }
}

export async function executeProposal(proposal: Proposal, context: Context) {
  const member = context.members.find(m => m.id === proposal.assigneeId)
  if (proposal.type === "task" && proposal.projectId) {
    await createTask({ title: proposal.title, projectId: proposal.projectId, assigneeNames: member ? [member.name] : [], priority: proposal.priority, tags: [], description: proposal.description })
  } else if (proposal.type === "ticket") {
    const user = await getCurrentUser()
    await saveLocalTicket(crypto.randomUUID(), { title: proposal.title, projectId: proposal.projectId ?? undefined, assigneeId: member?.id, assigneeName: member?.name, assigneeAvatarUrl: member?.avatarUrl, priority: proposal.priority, description: proposal.description, subject: "general", status: "todo", permissionIds: [], createdById: user.id, createdByName: user.name })
  } else throw new Error("Invalid proposal")
}

export async function memberReport(memberId: string, context: Context): Promise<string> {
  const member = context.members.find(m => m.id === memberId)
  if (!member) throw new Error("Unknown member")
  if (context.members.filter(m => m.name === member.name).length > 1) return `برای «${member.name}» چند حساب هم‌نام وجود دارد و مسئول تسک‌ها با نام ذخیره شده است؛ گزارش قابل اتکا نیست.`
  const tasks = await backendRequest<Task[]>("/tasks")
  const mine = tasks.filter(t => t.assigneeNames?.includes(member.name))
  const count = (status: Task["status"]) => mine.filter(t => t.status === status).length
  return `### گزارش ${member.name}\n\n| شاخص | تعداد |\n| --- | ---: |\n| کل تسک‌های قابل‌دسترسی | ${mine.length} |\n| انجام‌نشده | ${count("todo")} |\n| در حال انجام | ${count("in-progress")} |\n| تکمیل‌شده | ${count("completed")} |\n\nاین گزارش وضعیت فعلی تسک‌های قابل‌دسترسی شما را نشان می‌دهد. زمان هر تسک بین مسئولان تفکیک نشده است.`
}
