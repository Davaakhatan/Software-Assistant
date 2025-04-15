"use server"

import OpenAI from "openai"

interface AITextOptions {
  temperature?: number
  maxTokens?: number
  timeout?: number
}

export async function generateAIText(
  prompt: string,
  systemPrompt = "You are a helpful assistant.",
  options: AITextOptions = {},
): Promise<{ success: boolean; text?: string; error?: string }> {
  const { temperature = 0.7, maxTokens = 2000, timeout = 30000 } = options

  try {
    // Check if we have an API key
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.warn("No OpenAI API key found. Using fallback response.")
      return {
        success: false,
        error: "OpenAI API key not configured",
        text: `// Fallback response (no API key)
// This is a placeholder response since the OpenAI API key is not configured.
// Please add your API key to the environment variables.

function main() {
  console.log("Hello from the fallback response!");
  return "This is a fallback response.";
}

export default main;`,
      }
    }

    // Create OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    })

    // Set up timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await openai.chat.completions.create(
        {
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: temperature,
          max_tokens: maxTokens,
        },
        { signal: controller.signal },
      )

      clearTimeout(timeoutId)

      const generatedText = response.choices[0]?.message?.content?.trim()

      if (!generatedText) {
        return {
          success: false,
          error: "No text was generated",
        }
      }

      return {
        success: true,
        text: generatedText,
      }
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === "AbortError") {
        return {
          success: false,
          error: "Request timed out",
        }
      }
      throw error
    }
  } catch (error) {
    console.error("Error generating AI text:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
