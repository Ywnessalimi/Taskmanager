import { backendRequest } from "./backend-client"
import type { CurrentUser, PublicUser } from "./types"

export async function getCurrentUser(): Promise<CurrentUser> {
  return backendRequest<CurrentUser>("/auth/me")
}

export async function updateCurrentUser(input: Pick<CurrentUser, "name" | "email" | "bio" | "avatarUrl">): Promise<CurrentUser> {
  return backendRequest<CurrentUser>("/auth/me", { method: "PATCH", body: JSON.stringify(input) })
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  const user = await getCurrentUser()
  if (id !== user.id) return null

  return {
    id: user.id,
    name: user.name,
    role: "admin",
    activity: [],
    email: user.email,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    organizations: [],
  }
}
