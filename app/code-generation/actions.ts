// IMPORTANT: REMOVE THE "use client" DIRECTIVE COMPLETELY
// ONLY KEEP THE "use server" DIRECTIVE

"use server"

import { getSupabaseServer } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { generateAIText } from "@/lib/ai-service"

// Function to validate UUID format
function isValidUUID(id: string | undefined): boolean {
  if (!id) return true // Consider null/undefined as valid
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export async function generateCode(language: string, framework: string, requirements: string) {
  try {
    // Create a prompt for the AI
    const prompt = `
      Generate ${language} code using the ${framework} framework based on the following requirements:
      
      ${requirements}
      
      Please provide clean, well-structured code with comments.
    `

    const systemPrompt = `You are an expert software developer specializing in ${language} and ${framework}. 
Generate high-quality, production-ready code based on the requirements provided.
Follow these guidelines:
1. Write clean, well-structured, and commented code
2. Follow best practices for ${language} and ${framework}
3. Implement proper error handling
4. Ensure the code is secure and follows modern development standards
5. Include necessary type definitions if using TypeScript
6. Keep your response concise and focused on the most important functionality.`

    // Generate code using AI with a timeout
    const result = await generateAIText(prompt, systemPrompt, {
      temperature: 0.5, // Lower temperature for more predictable results
      maxTokens: 2000, // Limit token count to avoid timeouts
    })

    if (result.success && result.text) {
      return { success: true, code: result.text }
    } else {
      // Generate fallback code
      const fallbackCode = `// Fallback code for ${language} using ${framework}
// The AI service timed out or encountered an error
// Here's a simple example to get you started:

${
  language === "typescript"
    ? `import React, { useState } from 'react';

interface Props {
  title?: string;
}

export default function ExampleComponent({ title = "Hello World" }: Props) {
  const [count, setCount] = useState(0);
  
  return (
    <div className="p-4 border rounded shadow">
      <h1 className="text-xl font-bold">{title}</h1>
      <p>Count: {count}</p>
      <button 
        className="px-4 py-2 mt-2 text-white bg-blue-500 rounded hover:bg-blue-600"
        onClick={() => setCount(prev => prev + 1)}
      >
        Increment
      </button>
    </div>
  );
}`
    : `// Simple example in ${language}
function main() {
  console.log("Hello World from ${framework}!");
}

main();`
}
`

      return {
        success: false,
        error: result.error || "Failed to generate code",
        fallbackCode,
      }
    }
  } catch (error) {
    console.error("Error generating code:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate code. Please try again.",
      fallbackCode: `// Error occurred while generating code
console.log("An error occurred during code generation");`,
    }
  }
}

export async function generateFromSpecificationAndDesign(
  specificationId: string,
  designId: string,
  language: string,
  framework: string,
) {
  try {
    const supabase = getSupabaseServer()

    // Fetch specification
    const { data: specification, error: specError } = await supabase
      .from("specifications")
      .select("*")
      .eq("id", specificationId)
      .single()

    if (specError) {
      console.error("Error fetching specification:", specError)
      return { success: false, error: "Failed to fetch specification" }
    }

    // Fetch design - make this optional
    let design = null
    if (designId && designId !== "none") {
      const { data, error: designError } = await supabase.from("designs").select("*").eq("id", designId).single()

      if (!designError) {
        design = data
      } else {
        console.warn("Error fetching design, continuing without design data:", designError)
      }
    }

    // Build prompt based on specification and design
    let prompt = `Generate ${language} code using the ${framework} framework based on the following information:

`

    if (specification) {
      prompt += `## Specification
`
      prompt += `App Name: ${specification.app_name || "N/A"}
`
      prompt += `App Type: ${specification.app_type || "N/A"}
`
      prompt += `Description: ${specification.app_description || "N/A"}
`

      if (specification.functional_requirements) {
        prompt += `
Functional Requirements:
${specification.functional_requirements}
`
      }

      if (specification.non_functional_requirements) {
        prompt += `
Non-Functional Requirements:
${specification.non_functional_requirements}
`
      }
    }

    if (design) {
      prompt += `
## Design
`
      prompt += `Type: ${design.type || "N/A"}
`

      if (design.diagram_code) {
        prompt += `
Diagram:
${design.diagram_code}
`
      }

      if (design.description) {
        prompt += `
Description:
${design.description}
`
      }
    }

    // Simplify the prompt if it's too long
    if (prompt.length > 4000) {
      console.log("Prompt is too long, simplifying...")
      prompt = `Generate ${language} code using the ${framework} framework for an application with the following details:
- Name: ${specification.app_name || "N/A"}
- Type: ${specification.app_type || "N/A"}
- Key requirements: ${specification.functional_requirements ? specification.functional_requirements.substring(0, 500) + "..." : "N/A"}
- Please focus on creating a minimal viable implementation.`
    }

    prompt += `
Please generate complete, well-structured ${language} code using the ${framework} framework that implements these requirements.`

    // Generate code using AI
    const systemPrompt = `You are an expert software developer specializing in ${language} and ${framework}. 
Generate high-quality, production-ready code based on the provided specifications and designs. 
Include comments and explanations where appropriate.
Follow best practices for ${language} and ${framework}.
Keep your response concise and focused on the most important functionality.`

    const result = await generateAIText(prompt, systemPrompt, {
      temperature: 0.5, // Lower temperature for more predictable results
      maxTokens: 2000, // Limit token count to avoid timeouts
    })

    if (result.success && result.text) {
      return { success: true, code: result.text }
    } else {
      // Generate fallback code
      const fallbackCode = `// Fallback code for ${specification?.app_name || "application"} using ${framework}
// The AI service timed out or encountered an error
// Here's a simple example to get you started:

${
  language === "typescript"
    ? `import React, { useState } from 'react';

interface Props {
  title?: string;
}

export default function ${specification?.app_name?.replace(/\s+/g, "") || "Example"}Component({ title = "${specification?.app_name || "Hello World"}" }: Props) {
  const [count, setCount] = useState(0);
  
  return (
    <div className="p-4 border rounded shadow">
      <h1 className="text-xl font-bold">{title}</h1>
      <p>Count: {count}</p>
      <button 
        className="px-4 py-2 mt-2 text-white bg-blue-500 rounded hover:bg-blue-600"
        onClick={() => setCount(prev => prev + 1)}
      >
        Increment
      </button>
    </div>
  );
}`
    : `// Simple example in ${language}
function main() {
  console.log("Hello World from ${specification?.app_name || "application"}!");
}

main();`
}
`

      return {
        success: false,
        error: result.error || "Failed to generate code",
        fallbackCode,
      }
    }
  } catch (error) {
    console.error("Error generating code from specification and design:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate code. Please try again.",
      fallbackCode: `// Error occurred while generating code
console.log("An error occurred during code generation");`,
    }
  }
}

export async function saveGeneratedCode(
  code: string,
  language: string,
  framework: string,
  requirements: string,
  specificationId?: string,
  designId?: string,
) {
  try {
    const supabase = getSupabaseServer()

    // Validate UUIDs
    const validSpecificationId = isValidUUID(specificationId) ? specificationId : null
    const validDesignId = isValidUUID(designId) ? designId : null

    const insertData = {
      generated_code: code,
      language,
      framework,
      requirements,
      specification_id: validSpecificationId,
      design_id: validDesignId,
      created_at: new Date().toISOString(),
    }

    console.log("Data being inserted into generated_code table:", insertData)

    // Save the generated code to the database
    const { data, error } = await supabase.from("code_generations").insert([insertData]).select()

    if (error) {
      console.error("Error saving generated code:", error)
      try {
        console.error("Error object (stringified):", JSON.stringify(error, null, 2))
      } catch (e) {
        console.error("Error stringifying error object:", e)
      }
      console.error("Error properties:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return { success: false, error: error.message }
    }

    revalidatePath("/code-generation")
    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error saving generated code:", error)
    try {
      console.error("Error object (stringified):", JSON.stringify(error, null, 2))
    } catch (e) {
      console.error("Error stringifying error object:", e)
    }
    if (error instanceof Error) {
      console.error("Error stack trace:", error.stack)
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save code. Please try again.",
    }
  }
}

export async function getGeneratedCode() {
  try {
    const supabase = getSupabaseServer()
    const { data, error } = await supabase
      .from("code_generations")
      .select("*, specifications(app_name), designs(type)")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching generated code:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching generated code:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch generated code. Please try again.",
    }
  }
}

export async function getGeneratedCodeById(id: string) {
  try {
    const supabase = getSupabaseServer()

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return {
        success: false,
        error: "Invalid generated code ID format",
      }
    }

    const { data, error } = await supabase
      .from("code_generations")
      .select("*, specifications(app_name), designs(type)")
      .eq("id", id)
      .single()

    if (error) {
      throw error
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error("Error fetching generated code by ID:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch generated code. Please try again.",
    }
  }
}

export async function deleteGeneratedCode(id: string) {
  try {
    const supabase = getSupabaseServer()

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return {
        success: false,
        error: "Invalid generated code ID format",
      }
    }

    const { error } = await supabase.from("code_generations").delete().eq("id", id)

    if (error) {
      throw error
    }

    revalidatePath("/code-generation")
    return {
      success: true,
    }
  } catch (error) {
    console.error("Error deleting generated code:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete generated code. Please try again.",
    }
  }
}
