import { saveLocalTicket } from "@/features/tickets/local-created-tickets"
import { getMyTasksOverview } from "@/lib/api/my-tasks"
import { createTask, getTaskFormOptions } from "@/lib/api/tasks"
import { getCurrentUser } from "@/lib/api/users"
import type { NewTaskInput, NewTicketInput } from "@/lib/api/types"

/** Minimal tool-call contract for an AI provider adapter. Mutating tools require user approval. */
export type AIToolCall =
  | { name: "create_task"; arguments: NewTaskInput }
  | { name: "create_ticket"; arguments: Omit<NewTicketInput, "createdById" | "createdByName" | "createdByAvatarUrl"> }
  | { name: "get_my_tasks_report"; arguments: Record<string, never> }

export type AIToolResult = {
  tool: AIToolCall["name"]
  data: unknown
}

/** Tool descriptions are provider-neutral; an LLM adapter can map these into its function-call format. */
export const AI_TOOL_CATALOG = [
  { name: "create_task", description: "Create a task in a project. Ask the user to confirm before execution." },
  { name: "create_ticket", description: "Create a ticket for the current user. Ask the user to confirm before execution." },
  { name: "get_my_tasks_report", description: "Return a summary of the current user's tasks and workload." },
] as const

/** Execute one validated provider tool call. The caller must obtain approval for create_* calls first. */
export async function executeAITool(call: AIToolCall): Promise<AIToolResult> {
  switch (call.name) {
    case "create_task": {
      if (!call.arguments.title.trim()) throw new Error("Task title is required")
      const projects = await getTaskFormOptions()
      if (!projects.some((project) => project.id === call.arguments.projectId)) throw new Error("Project is unavailable")
      const user = await getCurrentUser()
      return { tool: call.name, data: await createTask(call.arguments, { id: user.id, name: user.name }) }
    }
    case "create_ticket": {
      if (!call.arguments.title.trim()) throw new Error("Ticket title is required")
      const user = await getCurrentUser()
      const ticket: NewTicketInput = {
        ...call.arguments,
        createdById: user.id,
        createdByName: user.name,
        createdByAvatarUrl: user.avatarUrl,
      }
      const id = `ai-${Date.now()}`
      await saveLocalTicket(id, ticket)
      return { tool: call.name, data: { id, ...ticket } }
    }
    case "get_my_tasks_report": {
      const report = await getMyTasksOverview()
      return {
        tool: call.name,
        data: {
          statusDistribution: report.statusDistribution,
          health: report.health,
          attentionRequired: report.attentionRequired.map(({ id, title, projectId, dueDate, priority, status }) => ({ id, title, projectId, dueDate, priority, status })),
        },
      }
    }
  }
}
