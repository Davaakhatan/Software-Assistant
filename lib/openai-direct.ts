/**
 * Direct OpenAI API client implementation that doesn't rely on our API routes
 * This serves as a fallback when our API routes have issues
 */

interface OpenAIOptions {
  temperature?: number
  maxTokens?: number
  apiKey?: string
}

interface OpenAIResult {
  success: boolean
  text?: string
  error?: string
}

/**
 * Makes a direct call to the OpenAI API without going through our API routes
 */
export async function callOpenAIDirectly(
  prompt: string,
  systemPrompt = "",
  options: OpenAIOptions = {},
): Promise<OpenAIResult> {
  try {
    // Get API key from options or localStorage
    let apiKey = options.apiKey
    if (!apiKey && typeof window !== "undefined") {
      apiKey = localStorage.getItem("openai_api_key") || ""
    }

    if (!apiKey || !apiKey.startsWith("sk-")) {
      throw new Error("OpenAI API key is missing or invalid")
    }

    // Call OpenAI API directly
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo-16k",
        messages: [
          { role: "system", content: systemPrompt || "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 4000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenAI API error: ${response.status} ${errorData.error?.message || "Unknown error"}`)
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
    console.error("Error calling OpenAI directly:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

/**
 * Generates a data model diagram using direct OpenAI API calls
 */
export async function generateDataModelDiagram(
  appName: string,
  appType: string,
  appDescription: string,
  databaseSchema: string,
  options: OpenAIOptions = {},
): Promise<{ success: boolean; diagram?: string; error?: string }> {
  const prompt = `
Generate a Mermaid diagram for the data model of the following application:

App Name: ${appName || "Unknown"}
App Type: ${appType || "web"}
Description: ${appDescription || ""}

${
  databaseSchema
    ? `# Database Schema
${databaseSchema}

Please use the above database schema information to create an accurate data model.`
    : ""
}

Please generate a Mermaid diagram using the 'classDiagram' syntax that shows the data model.
If a database schema is provided above, use it as the primary source for creating the diagram.
Include all tables mentioned in the schema with their fields and relationships.
Do not use curly braces {} for class definitions.
Instead, define each property on a separate line with the class name followed by a colon.
Show relationships between entities with proper cardinality (one-to-one, one-to-many, many-to-many).
Do not include any explanatory text, only the Mermaid diagram code.
Do not use comments (lines starting with %%) in the diagram.
Do not use the tilde (~) character, use dot (.) instead for nested types.
`

  const systemPrompt = "You are a database architect expert in creating Mermaid diagrams for data models."

  const result = await callOpenAIDirectly(prompt, systemPrompt, options)

  if (result.success && result.text) {
    // Extract the Mermaid diagram from the response
    let diagramCode = result.text

    // Clean up the response to extract just the Mermaid diagram
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

    // If we still don't have a valid diagram, return an error
    if (!diagramCode.includes("classDiagram") && !diagramCode.includes("erDiagram")) {
      return {
        success: false,
        error: "Failed to generate a valid diagram",
      }
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
