import { backendRequest } from "./backend-client"
import type { Notification } from "./types"

export async function getNotifications(recipientName: string): Promise<Notification[]> {
  return backendRequest<Notification[]>(`/notifications?recipientName=${encodeURIComponent(recipientName)}`)
}

export async function markNotificationRead(id: string, recipientName: string): Promise<void> {
  return backendRequest<void>(`/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
    body: JSON.stringify({ recipientName }),
  })
}
