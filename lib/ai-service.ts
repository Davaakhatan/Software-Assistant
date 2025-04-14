import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export type AIProvider = "openai" | "deepseek"

export interface AIServiceOptions {
  provider?: AIProvider
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
}

/**
 * Generates text using the AI SDK with timeout handling
 */
export async function generateAIText(
  prompt: string,
  systemPrompt = "",
  options: AIServiceOptions = {},
): Promise<{ success: boolean; text?: string; error?: string }> {
  const { temperature = 0.7, maxTokens, timeoutMs = 25000 } = options

  try {
    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`AI request timed out after ${timeoutMs}ms`))
      }, timeoutMs)
    })

    // The actual AI request using the AI SDK
    const aiRequestPromise = generateText({
      model: openai("gpt-4o"),
      prompt,
      system: systemPrompt,
      temperature,
      maxTokens,
    }).then((result) => ({
      success: true as const,
      text: result.text,
    }))

    // Race between the timeout and the actual request
    const result = await Promise.race([aiRequestPromise, timeoutPromise])
    return result
  } catch (error) {
    console.error("Error generating text with AI:", error)

    // Check if it's a timeout error
    if (error instanceof Error && error.message.includes("timed out")) {
      return {
        success: false,
        error: "The AI service took too long to respond. Please try with a simpler request or try again later.",
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
