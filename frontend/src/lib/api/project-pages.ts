import { backendRequest } from "./backend-client"

export type ProjectPageKind = "document" | "chat"
export type ProjectPageRecord = { id: string; projectId: string; kind: ProjectPageKind; title: string; content: string; updatedAt: string }
export type ProjectChatMessage = { id: string; projectId: string; authorName: string; text: string; createdAt: string }

export function getProjectPages(projectId: string) {
  return backendRequest<ProjectPageRecord[]>(`/projects/${encodeURIComponent(projectId)}/pages`)
}

export function saveProjectPage(projectId: string, kind: ProjectPageKind, input: Pick<ProjectPageRecord, "title" | "content">) {
  return backendRequest<ProjectPageRecord>(`/projects/${encodeURIComponent(projectId)}/pages/${kind}`, { method: "PUT", body: JSON.stringify(input) })
}

export function getProjectChatMessages(projectId: string) {
  return backendRequest<ProjectChatMessage[]>(`/projects/${encodeURIComponent(projectId)}/chat`)
}

export function createProjectChatMessage(projectId: string, input: Pick<ProjectChatMessage, "authorName" | "text">) {
  return backendRequest<ProjectChatMessage>(`/projects/${encodeURIComponent(projectId)}/chat`, { method: "POST", body: JSON.stringify(input) })
}
