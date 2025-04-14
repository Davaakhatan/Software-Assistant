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
    const result = await generateText({
      model: openai("gpt-4o"),
      prompt,
      system: systemPrompt,
      temperature,
      maxTokens,
    })

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
