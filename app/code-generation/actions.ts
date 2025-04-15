"use server"

import { getSupabaseServer } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

// Function to validate UUID format
function isValidUUID(id: string | undefined): boolean {
  if (!id) return true // Consider null/undefined as valid
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export async function generateCode(language: string, framework: string, requirements: string) {
  try {
    // Create a simple code example for demonstration
    const generatedCode = `// Generated ${language} code using ${framework}
// Based on requirements: ${requirements}

function main() {
  console.log("Hello from generated code!");
  return "Generated successfully";
}

export default main;`

    return { success: true, code: generatedCode }
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

    // Create a simple code example for demonstration
    const generatedCode = `// Generated ${language} code using ${framework}
// Based on specification: ${specification.app_name}
${designId ? "// Using design ID: " + designId : ""}

function main() {
  console.log("Hello from ${specification.app_name}!");
  return "Generated successfully";
}

export default main;`

    return { success: true, code: generatedCode }
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

    console.log("Data being inserted into code_generations table:", insertData)

    // Save the generated code to the database
    const { data, error } = await supabase.from("code_generations").insert([insertData]).select()

    if (error) {
      console.error("Error saving generated code:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/code-generation")
    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error saving generated code:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save code. Please try again.",
    }
  }
}

export async function getGeneratedCode() {
  try {
    const supabase = getSupabaseServer()

    // Try to fetch data from the code_generations table
    const { data, error } = await supabase
      .from("code_generations")
      .select("*, specifications(app_name), designs(type)")
      .order("created_at", { ascending: false })

    if (error) {
      // If the table doesn't exist, return an empty array instead of an error
      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        return { success: true, data: [] }
      }

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
      // If the table doesn't exist, provide a clear error message
      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        return {
          success: false,
          error: "The code_generations table does not exist yet. Please generate and save some code first.",
        }
      }

      console.error("Error fetching generated code by ID:", error)
      return { success: false, error: error.message }
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
      console.error("Error deleting generated code:", error)
      return { success: false, error: error.message }
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
