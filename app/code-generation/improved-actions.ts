"use client"

"use server"

import { getSupabaseServer } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { generateAIText } from "@/lib/ai-service"

// Function to validate UUID format
function isValidUUID(id: string | undefined): boolean {
  if (!id || id === "" || id === "none") return false // Consider null/undefined/empty string/none as invalid UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export async function generateFromImprovedSpecification(
  specificationId: string,
  designId: string,
  language: string,
  framework: string,
) {
  try {
    const supabase = getSupabaseServer()

    // Fetch specification from the new schema
    const { data: specificationData, error: specError } = await supabase
      .from("specifications_new")
      .select(`
        *,
        specification_types(name)
      `)
      .eq("id", specificationId)
      .single()

    if (specError) {
      console.error("Error fetching specification:", specError)
      return { success: false, error: "Failed to fetch specification" }
    }

    // Fetch specification content
    const { data: contentData, error: contentError } = await supabase
      .from("specification_content")
      .select(`
        content,
        specification_sections(name)
      `)
      .eq("specification_id", specificationId)

    if (contentError) {
      console.error("Error fetching specification content:", contentError)
      return { success: false, error: "Failed to fetch specification content" }
    }

    // Organize content by section name
    const sections = {}
    contentData.forEach((item) => {
      sections[item.specification_sections.name] = item.content
    })

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

    if (specificationData) {
      prompt += `## Specification
`
      prompt += `App Name: ${specificationData.app_name || "N/A"}
`
      prompt += `App Type: ${specificationData.specification_types?.name || "N/A"}
`
      prompt += `Description: ${specificationData.app_description || "N/A"}
`

      if (sections.functional_requirements) {
        prompt += `
Functional Requirements:
${sections.functional_requirements}
`
      }

      if (sections.non_functional_requirements) {
        prompt += `
Non-Functional Requirements:
${sections.non_functional_requirements}
`
      }

      if (sections.system_architecture) {
        prompt += `
System Architecture:
${sections.system_architecture}
`
      }

      if (sections.api_design) {
        prompt += `
API Design:
${sections.api_design}
`
      }

      if (sections.database_schema) {
        prompt += `
Database Schema:
${sections.database_schema}
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
- Name: ${specificationData.app_name || "N/A"}
- Type: ${specificationData.specification_types?.name || "N/A"}
- Key requirements: ${
        sections.functional_requirements ? sections.functional_requirements.substring(0, 500) + "..." : "N/A"
      }
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
      const fallbackCode = `// Fallback code for ${specificationData?.app_name || "application"} using ${framework}
// The AI service timed out or encountered an error
// Here's a simple example to get you started:

${
  language === "typescript"
    ? `import React, { useState } from 'react';

interface Props {
  title?: string;
}

export default function ${
        specificationData?.app_name?.replace(/\s+/g, "") || "Example"
      }Component({ title = "${specificationData?.app_name || "Hello World"}" }: Props) {
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
  console.log("Hello World from ${specificationData?.app_name || "application"}!");
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

export async function saveGeneratedCodeImproved(
  code: string,
  language: string,
  framework: string,
  requirements: string,
  specificationId?: string,
  designId?: string,
) {
  try {
    const supabase = getSupabaseServer()

    // Validate UUIDs - only use them if they're valid UUIDs
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

    console.log("Data being inserted into code_generations table:", insertData)

    // Save the generated code to the database
    const { data, error } = await supabase.from("code_generations").insert([insertData]).select()

    if (error) {
      console.error("Error saving generated code:", error)
      try {
        console.error("Error object (stringified):", JSON.stringify(error, null, 2))
      } catch (e) {
        console.error("Error stringifying error object:", e)
      }
      console.error("Error properties:", error.message)
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
