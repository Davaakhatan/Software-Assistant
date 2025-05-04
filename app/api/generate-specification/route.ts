import { apiFetch } from "./api-utils"
import { createApiUrl } from "./url-utils"

export async function generateAIText(
  prompt: string,
  systemPrompt = "",
  options: { temperature?: number; apiKey?: string } = {},
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    // …resolve your API key here…

    // Build an absolute URL to your Next.js API route:
    const url = createApiUrl("/api/generate-specification")

    // Now fetch that—no chance of routing to your page:
    const response = await apiFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, systemPrompt, temperature: options.temperature, apiKey: options.apiKey }),
    })

    // Always read as text first so we can catch HTML bodies:
    const textBody = await response.text()
    let data: any
    try {
      data = JSON.parse(textBody)
    } catch {
      throw new Error(
        `Expected JSON but got:\n${textBody.slice(0,200)}…`
      )
    }

    if (!response.ok || !data.success) {
      throw new Error(data.error || `HTTP ${response.status}`)
    }

    return { success: true, text: data.text }
  } catch (err: any) {
    console.error("Error generating AI text:", err)
    return { success: false, error: err.message }
  }
}
