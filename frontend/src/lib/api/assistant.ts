import { apiBaseUrl, backendRequest } from "./backend-client"

export type AssistantMessage = { role: "user" | "assistant"; content: string }

export type TaskDraft = { title: string; description?: string; assigneeIds?: string[]; assigneeNames?: string[]; priority?: string; dueDate?: string | null; status?: string; subtasks?: TaskDraft[] }
export type PreviewItem = { key: string; title: string; projectName: string; reason?: string; input?: Partial<TaskDraft> & { subject?: string; permissionIds?: string[]; widgets?: string[] }; original?: TaskDraft; patch?: Partial<TaskDraft>; assigneeNames?: string[] }
export type PreviewWidget = { type: "preview"; id: string; kind: string; expiresAt: string; summary: string; items: PreviewItem[] }
export type ReportColumn = "displayId" | "title" | "project" | "assignees" | "status" | "priority" | "dueDate" | "createdAt" | "timeSpentMinutes"
export type TaskReport = { id: string; title: string; generatedAt: string; summary: { total: number; todo: number; inProgress: number; completed: number }; limitations: string[]; rows: (Record<ReportColumn, string | number> & { id: string })[] }
export type ExportOptions = { format: "xlsx" | "csv" | "docx" | "pdf"; title?: string; columns?: ReportColumn[]; sortBy?: Exclude<ReportColumn, "displayId" | "timeSpentMinutes">; groupBy?: "none" | "project" | "status"; locale?: "fa" | "en" }
export type AssistantWidget = PreviewWidget | { type: "question"; question: string; options: string[] } | { type: "report"; report: TaskReport } | ({ type: "file"; reportId: string } & ExportOptions)
export type AssistantResponse = { reply: string; widgets: AssistantWidget[]; usedSkills: string[] }
export type SavedItems = { items: { id: string; title: string; href: string }[] }
export type IntegrationToken = { id: string; name: string; projectIds: string[]; scopes: string[]; expiresAt: string }

export async function sendAssistantMessage(messages: AssistantMessage[], locale: string): Promise<AssistantResponse> {
  return backendRequest<AssistantResponse>("/assistant/chat", {
    method: "POST",
    body: JSON.stringify({ messages, locale }),
  })
}

export function readAssistantAttachment(file: File): Promise<{ text: string }> {
  return backendRequest(`/assistant/attachments?name=${encodeURIComponent(file.name)}`, {
    method: "POST", headers: { "content-type": "application/octet-stream" }, body: file,
  })
}

export const confirmAssistantPreview = (id: string, selectedKeys: string[]) => backendRequest<SavedItems>(`/assistant/previews/${encodeURIComponent(id)}/confirm`, { method: "POST", body: JSON.stringify({ selectedKeys }) })
export const cancelAssistantPreview = (id: string) => backendRequest(`/assistant/previews/${encodeURIComponent(id)}/cancel`, { method: "POST", body: "{}" })
export const listIntegrationTokens = () => backendRequest<IntegrationToken[]>("/integrations/tokens")
export const issueIntegrationToken = (name: string, projectIds: string[], scopes: string[]) => backendRequest<{ id: string; token: string; expiresAt: string }>("/integrations/tokens", { method: "POST", body: JSON.stringify({ name, projectIds, scopes }) })
export const revokeIntegrationToken = (id: string) => backendRequest(`/integrations/tokens/${encodeURIComponent(id)}`, { method: "DELETE" })

export async function downloadAssistantReport(reportId: string, options: ExportOptions) {
  const response = await fetch(`${apiBaseUrl()}/assistant/reports/${encodeURIComponent(reportId)}/export`, { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify(options) })
  if (!response.ok) {
    const error = await response.json().catch(() => undefined)
    throw new Error(error?.error?.message ?? "Download failed")
  }
  const objectUrl = URL.createObjectURL(await response.blob())
  const link = document.createElement("a")
  link.href = objectUrl
  link.download = `quire-report.${options.format}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30000)
}
