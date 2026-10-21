function apiBaseUrl() {
  if (typeof window !== "undefined") return (process.env.NEXT_PUBLIC_QUIRE_API_URL ?? "/api/v1").replace(/\/$/, "")
  return `${(process.env.QUIRE_API_ORIGIN ?? "http://127.0.0.1:4000").replace(/\/$/, "")}/api/v1`
}

export class BackendApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message)
    this.name = "BackendApiError"
  }
}

export async function backendRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (!headers.has("content-type")) headers.set("content-type", "application/json")
  if (typeof window !== "undefined" && window.navigator.userAgent) {
    headers.set("x-quire-user-agent", window.navigator.userAgent)
  }
  if (typeof window === "undefined") {
    const { headers: nextHeaders } = await import("next/headers")
    const cookie = (await nextHeaders()).get("cookie")
    if (cookie) headers.set("cookie", cookie)
  }
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  })
  if (response.status === 204) return undefined as T
  const body = await response.json().catch(() => undefined)
  if (!response.ok) throw new BackendApiError(body?.error?.message ?? `Backend request failed (${response.status})`, response.status, body?.error?.code)
  return body as T
}
