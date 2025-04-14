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
    // Add a timeout to prevent hanging requests
    const timeoutPromise = new Promise<{ success: false; error: string }>((_, reject) => {
      setTimeout(() => {
        reject(new Error("AI request timed out after 25 seconds"))
      }, 25000) // 25 second timeout
    })

    // The actual AI request
    const aiRequestPromise = generateText({
      model: openai("gpt-4o"),
      prompt,
      system: systemPrompt,
      temperature,
      maxTokens,
    }).then((result) => ({
      success: true,
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
