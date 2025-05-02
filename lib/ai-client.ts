"use client"

// Client-side AI service for generating text
export async function generateAIText(
  prompt: string,
  systemPrompt = "",
  options: {
    temperature?: number
    maxTokens?: number
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

    // First try with a relative URL
    let url = "/api/generate-specification"
    console.log("Attempting to fetch with relative URL:", url)

    try {
      const response = await fetch(url, {
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
        throw new Error(`HTTP error ${response.status}`)
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
      console.warn("Relative URL fetch failed, trying with absolute URL", error)

      // If relative URL fails, try with absolute URL
      const origin = window.location.origin
      url = new URL("/api/generate-specification", origin).toString()
      console.log("Retrying with absolute URL:", url)

      const response = await fetch(url, {
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
        let errorMessage = `HTTP error ${response.status}`
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          // If parsing JSON fails, use the default error message
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to generate text")
      }

      return {
        success: true,
        text: data.text,
      }
    }
  } catch (error) {
    console.error("Error generating AI text:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

// Check if an API key is available in localStorage
export function isApiKeyAvailable(): boolean {
  if (typeof window === "undefined") return false
  const apiKey = localStorage.getItem("openai_api_key")
  return !!apiKey && apiKey.startsWith("sk-")
}
