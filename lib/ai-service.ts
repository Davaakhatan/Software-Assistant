import { openai } from "@ai-sdk/openai"
import { createOpenAI as createDeepSeek } from "@ai-sdk/openai"
import { generateText } from "ai"

// Create a DeepSeek provider using the OpenAI-compatible interface
const deepseek = createDeepSeek({
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY || "",
  compatibility: "compatible", // Use compatible mode for third-party providers
})

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
): Promise<{ success: boolean; text?: string; error?: string; provider?: string; usage?: any }> {
  const { provider = "openai", temperature = 0.7, maxTokens } = options

  try {
    // Validate API keys before attempting to generate
    if (provider === "deepseek" && (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY.trim() === "")) {
      console.warn("DeepSeek API key is missing or empty. Falling back to OpenAI.")
      // Fall back to OpenAI if DeepSeek key is missing
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
        usage: result.usage,
        provider: "openai", // Indicate we fell back to OpenAI
        message: "Used OpenAI as fallback because DeepSeek API key is missing.",
      }
    }

    if (provider === "openai" && (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === "")) {
      console.warn("OpenAI API key is missing or empty. Falling back to DeepSeek.")
      // Fall back to DeepSeek if OpenAI key is missing
      if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY.trim() === "") {
        throw new Error("Both OpenAI and DeepSeek API keys are missing or invalid.")
      }

      const result = await generateText({
        model: deepseek("deepseek-chat"),
        prompt,
        system: systemPrompt,
        temperature,
        maxTokens,
      })

      return {
        success: true,
        text: result.text,
        usage: result.usage,
        provider: "deepseek", // Indicate we fell back to DeepSeek
        message: "Used DeepSeek as fallback because OpenAI API key is missing.",
      }
    }

    // Choose the provider based on the options
    const model = provider === "deepseek" ? deepseek("deepseek-chat") : openai("gpt-4o")

    const result = await generateText({
      model,
      prompt,
      system: systemPrompt,
      temperature,
      maxTokens,
    })

    return {
      success: true,
      text: result.text,
      usage: result.usage,
      provider,
    }
  } catch (error) {
    console.error("AI generation error:", error)

    // Try fallback provider if the primary one fails
    try {
      if (provider === "deepseek") {
        console.log("DeepSeek API failed. Trying OpenAI as fallback...")
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === "") {
          throw new Error("OpenAI API key is also missing or invalid. Cannot use fallback.")
        }

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
          usage: result.usage,
          provider: "openai", // Indicate we fell back to OpenAI
          message: "Used OpenAI as fallback because DeepSeek API failed.",
        }
      } else {
        console.log("OpenAI API failed. Trying DeepSeek as fallback...")
        if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY.trim() === "") {
          throw new Error("DeepSeek API key is also missing or invalid. Cannot use fallback.")
        }

        const result = await generateText({
          model: deepseek("deepseek-chat"),
          prompt,
          system: systemPrompt,
          temperature,
          maxTokens,
        })

        return {
          success: true,
          text: result.text,
          usage: result.usage,
          provider: "deepseek", // Indicate we fell back to DeepSeek
          message: "Used DeepSeek as fallback because OpenAI API failed.",
        }
      }
    } catch (fallbackError) {
      console.error("Fallback AI generation also failed:", fallbackError)
      return {
        success: false,
        error: `Primary provider (${provider}) failed: ${error instanceof Error ? error.message : "Unknown error"}. 
                Fallback also failed: ${fallbackError instanceof Error ? fallbackError.message : "Unknown error"}`,
      }
    }
  }
}

// Helper function for simpler code generation
export async function generateCodeWithAI(
  prompt: string,
  language = "typescript",
  framework = "nextjs",
): Promise<string> {
  const systemPrompt = `You are an expert software developer specializing in ${language} and ${framework}. 
Generate high-quality, production-ready code based on the requirements provided.
Follow these guidelines:
1. Write clean, well-structured, and commented code
2. Follow best practices for ${language} and ${framework}
3. Implement proper error handling
4. Ensure the code is secure and follows modern development standards
5. Include necessary type definitions if using TypeScript`

  try {
    const result = await generateAIText(prompt, systemPrompt)

    if (result.success && result.text) {
      return result.text
    } else {
      console.error("Failed to generate code:", result.error)
      return `// Error generating code: ${result.error || "Unknown error"}\n\n// Fallback code\nconsole.log("Code generation failed");`
    }
  } catch (error) {
    console.error("Error in generateCodeWithAI:", error)
    return `// Error generating code: ${error instanceof Error ? error.message : "Unknown error"}\n\n// Fallback code\nconsole.log("Code generation failed");`
  }
}
