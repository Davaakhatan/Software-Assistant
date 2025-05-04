/**
 * Direct OpenAI API client that bypasses our API routes
 * This is used as a fallback when our API routes fail
 */

interface OpenAIOptions {
  temperature?: number
  maxTokens?: number
  apiKey: string
}

interface OpenAIResult {
  success: boolean
  text?: string
  error?: string
}

/**
 * Makes a direct call to the OpenAI API
 */
export async function callOpenAIDirectly(
  prompt: string,
  systemPrompt: string,
  options: OpenAIOptions,
): Promise<OpenAIResult> {
  try {
    if (!options.apiKey || !options.apiKey.startsWith("sk-")) {
      throw new Error("OpenAI API key is missing or invalid")
    }

    // Prepare the messages array
    const messages = [
      { role: "system", content: systemPrompt || "You are a helpful assistant." },
      { role: "user", content: prompt },
    ]

    // Call OpenAI API directly using fetch with a hardcoded URL
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo-16k",
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 4000,
      }),
    })

    // Handle API errors
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}))
      throw new Error(`OpenAI API error: ${openaiResponse.status} ${errorData.error?.message || "Unknown error"}`)
    }

    // Parse the successful response
    const data = await openaiResponse.json()

    // Validate response structure
    if (!data?.choices?.[0]?.message?.content) {
      throw new Error("Invalid response from OpenAI")
    }

    // Return the generated text
    return {
      success: true,
      text: data.choices[0].message.content,
    }
  } catch (error) {
    console.error("Error in direct OpenAI call:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

/**
 * Generates a data model diagram using OpenAI
 */
export async function generateDataModelDiagram(
  appName: string,
  appType: string,
  appDescription: string,
  databaseSchema: string,
  options: {
    temperature?: number
    apiKey: string
  },
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

  const result = await callOpenAIDirectly(prompt, systemPrompt, {
    temperature: options.temperature || 0.7,
    apiKey: options.apiKey,
  })

  if (result.success && result.text) {
    // Clean up the AI response to extract just the Mermaid code
    let diagramCode = result.text.trim()

    // Remove any markdown code block markers if present
    diagramCode = diagramCode
      .replace(/```mermaid/g, "")
      .replace(/```/g, "")
      .trim()

    // Ensure it starts with classDiagram if not already
    if (!diagramCode.startsWith("classDiagram")) {
      diagramCode = "classDiagram\n" + diagramCode
    }

    const mermaidMatch = diagramCode.match(/```(?:mermaid)?\s*(classDiagram[\s\S]*?)```/m)
    if (mermaidMatch && mermaidMatch[1]) {
      diagramCode = mermaidMatch[1].trim()
    } else {
      // If no mermaid code block found, look for classDiagram or erDiagram
      const classMatch = diagramCode.match(/(classDiagram[\s\S]*)/i)
      if (classMatch && classMatch[1]) {
        diagramCode = classMatch[1].trim()
      } else {
        const erMatch = diagramCode.match(/(erDiagram[\s\S]*)/i)
        if (erMatch && erMatch[1]) {
          diagramCode = erMatch[1].trim()
        }
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
