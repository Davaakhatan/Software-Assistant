/**
 * Direct OpenAI API client that doesn't rely on internal API routes
 * This avoids URL parsing issues in different environments
 */

// Result of AI text generation
export interface AITextResult {
  success: boolean
  text?: string
  error?: string
}

/**
 * Generate text directly using the OpenAI API without going through our own API route
 */
export async function generateTextWithOpenAI(
  prompt: string,
  systemPrompt = "",
  options: {
    temperature?: number
    apiKey?: string
    model?: string
  } = {},
): Promise<AITextResult> {
  try {
    // Get API key from options or localStorage
    let apiKey = options.apiKey

    if (!apiKey && typeof window !== "undefined") {
      apiKey = localStorage.getItem("openai_api_key")
    }

    if (!apiKey || !apiKey.startsWith("sk-")) {
      throw new Error("OpenAI API key is missing or invalid")
    }

    // Prepare the request to OpenAI API
    const messages = [
      { role: "system", content: systemPrompt || "You are a helpful assistant." },
      { role: "user", content: prompt },
    ]

    // Make direct request to OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || "gpt-3.5-turbo-16k",
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data?.choices?.[0]?.message?.content) {
      throw new Error("Invalid response from OpenAI")
    }

    return {
      success: true,
      text: data.choices[0].message.content,
    }
  } catch (error) {
    console.error("Error generating text with OpenAI:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

/**
 * Generates a Mermaid diagram for data models using OpenAI
 */
export async function generateDataModelDiagram(
  appName: string,
  appType: string,
  appDescription: string,
  databaseSchema = "",
  options: {
    temperature?: number
    apiKey?: string
  } = {},
): Promise<{ success: boolean; diagram?: string; error?: string }> {
  const prompt = `
Generate a Mermaid diagram for the data model of the following application:

App Name: ${appName || "Unknown"}
App Type: ${appType || "web"}
Description: ${appDescription || ""}

${databaseSchema ? `# Database Schema\n${databaseSchema}\n\nPlease use the above database schema information to create an accurate data model.` : ""}

Please generate a Mermaid diagram using the 'classDiagram' syntax that shows the data model.
Include all tables with their fields and relationships.
Do not use curly braces {} for class definitions.
Instead, define each property on a separate line with the class name followed by a colon.
Show relationships between entities with proper cardinality (one-to-one, one-to-many, many-to-many).
Do not include any explanatory text, only the Mermaid diagram code.
Do not use comments (lines starting with %%) in the diagram.
Do not use the tilde (~) character, use dot (.) instead for nested types.
`

  const systemPrompt = "You are a database architect expert in creating Mermaid diagrams for data models."

  const result = await generateTextWithOpenAI(prompt, systemPrompt, {
    ...options,
    temperature: 0.7,
  })

  if (result.success && result.text) {
    // Clean up the response to extract just the Mermaid diagram
    let diagramCode = result.text.trim()

    // Extract code from markdown code blocks if present
    const mermaidMatch = diagramCode.match(/```(?:mermaid)?\s*(classDiagram[\s\S]*?)```/)
    if (mermaidMatch && mermaidMatch[1]) {
      diagramCode = mermaidMatch[1].trim()
    } else {
      // If no mermaid code block found, look for classDiagram or erDiagram
      const classMatch = diagramCode.match(/(classDiagram[\s\S]*?)(?=\n\s*\n|$)/)
      if (classMatch && classMatch[1]) {
        diagramCode = classMatch[1].trim()
      } else {
        const erMatch = diagramCode.match(/(erDiagram[\s\S]*?)(?=\n\s*\n|$)/)
        if (erMatch && erMatch[1]) {
          diagramCode = erMatch[1].trim()
        }
      }
    }

    // Ensure it starts with classDiagram if not already
    if (!diagramCode.startsWith("classDiagram")) {
      diagramCode = "classDiagram\n" + diagramCode
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
