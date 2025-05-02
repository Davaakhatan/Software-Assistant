// Check if an API key is available in localStorage
export function isApiKeyAvailable(): boolean {
  if (typeof window === "undefined") return false
  const apiKey = localStorage.getItem("openai_api_key")
  return !!apiKey && apiKey.startsWith("sk-")
}

// Generate text using the OpenAI API
export async function generateAIText(
  prompt: string,
  systemPrompt = "",
  options: {
    temperature?: number
  } = {},
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    // Get the API key from localStorage
    if (typeof window === "undefined") {
      throw new Error("Cannot access localStorage in server context")
    }

    const apiKey = localStorage.getItem("openai_api_key")
    if (!apiKey || !apiKey.startsWith("sk-")) {
      throw new Error("OpenAI API key is missing or invalid")
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
