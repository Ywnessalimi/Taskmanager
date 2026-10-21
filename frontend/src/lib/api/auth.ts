export type LoginInput = {
  identifier: string
  password: string
}

export type SignupInput = {
  fullName: string
  email: string
  phone: string
  password: string
}

import { backendRequest } from "./backend-client"
import type { AuthSession, CurrentUser } from "./types"

export function login(input: LoginInput): Promise<CurrentUser> {
  return backendRequest<CurrentUser>("/auth/login", { method: "POST", body: JSON.stringify(input) })
}

export function logout(): Promise<void> {
  return backendRequest<void>("/auth/logout", { method: "POST", body: "{}" })
}

export function getAuthSessions(): Promise<AuthSession[]> {
  return backendRequest<AuthSession[]>("/auth/sessions")
}

export function revokeAuthSession(sessionId: string): Promise<void> {
  return backendRequest<void>(`/auth/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" })
}

/** Public registration is disabled for the current single-account installation. */
export async function signup(_input: SignupInput): Promise<never> {
  throw new Error("ثبت‌نام عمومی غیرفعال است.")
}
