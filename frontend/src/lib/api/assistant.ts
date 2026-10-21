import { backendRequest } from "./backend-client"

export type AssistantMessage = { role: "user" | "assistant"; content: string }

export async function sendAssistantMessage(messages: AssistantMessage[]): Promise<string> {
  const result = await backendRequest<{ reply: string }>("/assistant/chat", {
    method: "POST",
    body: JSON.stringify({ messages }),
  })
  return result.reply
}
