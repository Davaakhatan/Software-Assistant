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
5. Include necessary type definitions if using TypeScript`

    // Generate code using AI
    const result = await generateAIText(prompt, systemPrompt)

    if (result.success && result.text) {
      return { success: true, code: result.text }
    } else {
      return { success: false, error: result.error || "Failed to generate code" }
    }
  } catch (error) {
    console.error("Error generating code:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate code. Please try again.",
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

    // Fetch design
    const { data: design, error: designError } = await supabase.from("designs").select("*").eq("id", designId).single()

    if (designError) {
      console.error("Error fetching design:", designError)
      return { success: false, error: "Failed to fetch design" }
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

    prompt += `
Please generate complete, well-structured ${language} code using the ${framework} framework that implements these requirements.`

    // Generate code using AI
    const systemPrompt = `You are an expert software developer specializing in ${language} and ${framework}. 
Generate high-quality, production-ready code based on the provided specifications and designs. 
Include comments and explanations where appropriate.
Follow best practices for ${language} and ${framework}.`

    const result = await generateAIText(prompt, systemPrompt)

    if (result.success && result.text) {
      return { success: true, code: result.text }
    } else {
      return { success: false, error: result.error || "Failed to generate code" }
    }
  } catch (error) {
    console.error("Error generating code from specification and design:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate code. Please try again.",
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
