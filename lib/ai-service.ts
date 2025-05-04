// lib/ai-service.ts
import { apiFetch } from "./api-utils"
import { createApiUrl } from "./url-utils"

export interface AIServiceOptions {
  provider?: string
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
  apiKey?: string
}

export interface AITextResult {
  success: boolean
  text?: string
  error?: string
}

export async function generateAIText(
  prompt: string,
  systemPrompt = "",
  options: {
    temperature?: number
    apiKey?: string
  } = {},
): Promise<AITextResult> {
  try {
    // --- Resolve API key ---
    let apiKey = options.apiKey
      || (typeof process !== "undefined" && process.env.OPENAI_API_KEY)
      || (typeof window !== "undefined" && localStorage.getItem("openai_api_key") || "")

    if (!apiKey?.startsWith("sk-")) {
      throw new Error("OpenAI API key is missing or invalid")
    }

    // --- Build an absolute URL to your Next.js route ---
    const url = createApiUrl("/api/generate-specification")

    // --- Fire the request ---
    const response = await apiFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, systemPrompt, temperature: options.temperature, apiKey }),
    })

    // --- Read raw text so we can detect HTML errors ---
    const textBody = await response.text()

    let data: any
    try {
      data = JSON.parse(textBody)
    } catch (err) {
      throw new Error(
        `Expected JSON but got:\n${textBody.slice(0, 300)}`
      )
    }

    if (!response.ok || !data.success) {
      throw new Error(data.error || `HTTP ${response.status}`)
    }

    return { success: true, text: data.text }
  } catch (error: any) {
    console.error("Error generating AI text:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}
