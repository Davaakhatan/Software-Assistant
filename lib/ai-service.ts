import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export type AIProvider = "openai" | "deepseek"

export interface AIServiceOptions {
  provider?: AIProvider
  temperature?: number
  maxTokens?: number
}

export async function generateAIText(
  prompt: string,
  systemPrompt = "",
  options: AIServiceOptions = {},
): Promise<{ success: boolean; text?: string; error?: string }> {
  const { temperature = 0.7, maxTokens } = options

  try {
    console.time("AI generation time")

    // Add a timeout to prevent hanging indefinitely
    const timeoutPromise = new Promise<{ success: false; error: string }>((_, reject) => {
      setTimeout(() => {
        reject({ success: false, error: "AI generation timed out after 50 seconds" })
      }, 50000) // 50 second timeout
    })

    const generationPromise = generateText({
      model: openai("gpt-4o"),
      prompt,
      system: systemPrompt,
      temperature,
      maxTokens,
    })

    // Race between the AI generation and the timeout
    const result = await Promise.race([generationPromise, timeoutPromise])

    console.timeEnd("AI generation time")

    return {
      success: true,
      text: result.text,
    }
  } catch (error) {
    console.error("Error generating text with AI:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
