import { BackendApiError, backendRequest } from "./backend-client"
import type { Organization, OrganizationMember } from "./types"

export function getOrganizations(): Promise<Organization[]> {
  return backendRequest<Organization[]>("/organizations")
}

export async function getOrganization(id: string): Promise<Organization | undefined> {
  return (await getOrganizations()).find((organization) => organization.id === id)
}

export async function getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
  try {
    const decodedSlug = decodeURIComponent(slug)
    return await backendRequest<Organization>(`/organizations/by-slug/${encodeURIComponent(decodedSlug)}`)
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 404) return undefined
    throw error
  }
}

export function updateOrganizationSettings(organizationId: string, settings: { name: string; description: string; slug: string; imageUrl: string | null; preferences: Record<string, unknown> }) {
  return backendRequest<Pick<Organization, "id" | "name" | "description" | "slug" | "imageUrl">>(`/organizations/${encodeURIComponent(organizationId)}/settings`, {
    method: "PATCH",
    body: JSON.stringify(settings),
  })
}

export function inviteOrganizationMember(organizationId: string, email: string) {
  return backendRequest<OrganizationMember>(`/organizations/${encodeURIComponent(organizationId)}/members`, {
    method: "POST",
    body: JSON.stringify({ email }),
  })
}

export function updateOrganizationMember(organizationId: string, userId: string, role: OrganizationMember["role"], permissions?: Record<string, boolean>) {
  return backendRequest<{ updated?: boolean; transferred?: boolean }>(`/organizations/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify({ role, permissions }),
  })
}

export function removeOrganizationMember(organizationId: string, userId: string) {
  return backendRequest<void>(`/organizations/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(userId)}`, { method: "DELETE" })
}

export function createOrganization(name: string) {
  return backendRequest<Pick<Organization, "id" | "name" | "createdAt">>("/organizations", {
    method: "POST",
    body: JSON.stringify({ name }),
  })
}

export function createDivision(organizationId: string, name: string) {
  return backendRequest<{ id: string; organizationId: string; name: string }>(`/organizations/${encodeURIComponent(organizationId)}/divisions`, {
    method: "POST",
    body: JSON.stringify({ name }),
  })
}

export function createProject(divisionId: string, name: string) {
  return backendRequest<{ id: string; name: string; organizationId: string; divisionId: string }>(`/divisions/${encodeURIComponent(divisionId)}/projects`, {
    method: "POST",
    body: JSON.stringify({ name }),
  })
}

export function moveProject(projectId: string, divisionId: string) {
  return backendRequest<{ id: string; name: string; organizationId: string; divisionId: string }>(`/projects/${encodeURIComponent(projectId)}/location`, {
    method: "PATCH",
    body: JSON.stringify({ divisionId }),
  })
}

export function moveDivision(sourceOrganizationId: string, divisionId: string, organizationId: string) {
  return backendRequest<{ id: string; name: string; organizationId: string }>(`/organizations/${encodeURIComponent(sourceOrganizationId)}/divisions/${encodeURIComponent(divisionId)}`, {
    method: "PATCH",
    body: JSON.stringify({ organizationId }),
  })
}
