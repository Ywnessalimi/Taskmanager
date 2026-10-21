const DEFAULT_BASE_URL = "https://service.nokod.ir/v1"
const DEFAULT_MODEL = "Qwen38"
const SYSTEM_PROMPT = "You are Quire's helpful project assistant. Reply in the same language as the user's latest message. Be concise and clear. You cannot create, edit, or delete tasks or tickets in this chat. Never claim that you performed an action."

export function createAIService({
  apiKey = process.env.AI_API_KEY,
  baseUrl = process.env.AI_API_BASE_URL ?? DEFAULT_BASE_URL,
  model = process.env.AI_MODEL ?? DEFAULT_MODEL,
} = {}) {
  return {
    async reply(messages) {
      if (!apiKey) {
        const error = new Error("Assistant provider is not configured")
        error.code = "assistant_not_configured"
        throw error
      }

      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
          max_tokens: 800,
          temperature: 0.4,
        }),
        signal: AbortSignal.timeout(30_000),
      })

      const result = await response.json().catch(() => undefined)
      if (!response.ok || result?.success === false) {
        const error = new Error(`AI provider request failed (${response.status})`)
        error.code = response.status === 401 ? "assistant_provider_auth" : "assistant_provider_error"
        throw error
      }

      const reply = typeof result?.choices?.[0]?.message?.content === "string"
        ? result.choices[0].message.content.trim()
        : ""
      if (!reply) {
        const error = new Error("AI provider returned an empty response")
        error.code = "assistant_empty_response"
        throw error
      }
      return reply
    },
  }
}

export const assistantMessageLimits = Object.freeze({
  maxMessages: 20,
  maxMessageLength: 6000,
})
