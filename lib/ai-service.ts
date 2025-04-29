// Define the supported AI providers
export type AIProvider = "openai" | "deepseek"

// Options for AI text generation
export interface AIServiceOptions {
  provider?: AIProvider
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
  apiKey?: string // Add explicit apiKey parameter
}

// Result of AI text generation
export interface AITextResult {
  success: boolean
  text?: string
  error?: string
}

// Update the isApiKeyAvailable function to check for environment variables
export function isApiKeyAvailable(): boolean {
  // Check for server-side environment variable first
  if (typeof process !== "undefined" && process.env.OPENAI_API_KEY) {
    return true
  }

  // Then check localStorage if in browser context
  if (typeof window !== "undefined") {
    const apiKey = localStorage.getItem("openai_api_key")
    return !!apiKey && apiKey.startsWith("sk-")
  }

  return false
}

// Update the generateAIText function to get API key from multiple sources
export async function generateAIText(
  prompt: string,
  systemPrompt = "",
  options: {
    temperature?: number
  } = {},
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    // Try to get API key from multiple sources
    let apiKey = ""

    // First check options
    if (options && options.apiKey) {
      apiKey = options.apiKey
    }
    // Then check environment variables (server-side)
    else if (typeof process !== "undefined" && process.env.OPENAI_API_KEY) {
      apiKey = process.env.OPENAI_API_KEY
    }
    // Finally check localStorage (client-side)
    else if (typeof window !== "undefined") {
      apiKey = localStorage.getItem("openai_api_key") || ""
    }

    if (!apiKey || !apiKey.startsWith("sk-")) {
      throw new Error("OpenAI API key is missing or invalid. Please add your API key in the Settings page.")
    }

    // Use our server-side API endpoint instead of direct OpenAI calls
    const response = await fetch("/api/generate-specification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        systemPrompt,
        temperature: options.temperature || 0.7,
        apiKey,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP error ${response.status}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Failed to generate text")
    }

    return {
      success: true,
      text: data.text,
    }
  } catch (error) {
    console.error("Error generating AI text:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

/**
 * Generates a Mermaid diagram for system architecture using AI
 */
export async function generateArchitectureDiagram(
  appName: string,
  appType: string,
  appDescription: string,
  options: AIServiceOptions = {},
): Promise<{ success: boolean; diagram?: string; error?: string }> {
  const prompt = `
Generate a Mermaid diagram for the system architecture of the following application:

App Name: ${appName || "Unknown"}
App Type: ${appType || "web"}
Description: ${appDescription || ""}

Requirements:
1. Use the 'graph TD' syntax for the Mermaid diagram
2. Include appropriate components based on the app type (${appType || "web"})
3. Show connections between components with arrows (-->)
4. Use subgraphs to organize related components
5. Include frontend, backend, and data storage components
6. Use simple node names like A, B, C with descriptive labels in square brackets
7. Ensure proper spacing and formatting

Your response should ONLY contain the Mermaid diagram code, nothing else.
Do not include any explanations, markdown formatting, or code blocks.
Start directly with 'graph TD' and end with the last line of the diagram.
`

  const systemPrompt = "You are an expert system architect who creates clear and accurate Mermaid diagrams."

  const result = await generateAIText(prompt, systemPrompt, {
    ...options,
    temperature: 0.7, // Use a slightly higher temperature for creativity
  })

  if (result.success && result.text) {
    // Clean up the AI response to extract just the Mermaid code
    let diagramCode = result.text.trim()

    // Remove any markdown code block markers if present
    diagramCode = diagramCode
      .replace(/```mermaid/g, "")
      .replace(/```/g, "")
      .trim()

    // Ensure it starts with graph TD if not already
    if (!diagramCode.startsWith("graph TD")) {
      diagramCode = "graph TD\n" + diagramCode
    }

    return {
      success: true,
      diagram: diagramCode,
    }
  }

  return {
    success: false,
    error: result.error || "Failed to generate diagram with AI",
  }
}
