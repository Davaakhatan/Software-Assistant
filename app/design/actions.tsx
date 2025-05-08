"use server"

import { getSupabaseServer } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

export async function getDesigns() {
  try {
    console.log("Fetching designs from actions.ts...")
    const supabaseServer = getSupabaseServer()
    const { data, error } = await supabaseServer
      .from("designs")
      .select("*, requirements(project_name)")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching designs:", error)
      throw error
    }

    console.log(`Successfully fetched ${data?.length || 0} designs from actions.ts`)

    // Revalidate paths to ensure fresh data
    revalidatePath("/design")
    revalidatePath("/design-list")
    revalidatePath("/code-generation")

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error("Error fetching designs:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function saveDesign({ type, diagramCode, requirementId, specificationId, projectName }) {
  try {
    // Use the server-side Supabase client to bypass RLS
    const supabase = getSupabaseServer()

    let finalRequirementId = requirementId

    // If we have a specificationId but no requirementId, create a requirement
    if (specificationId && !requirementId) {
      // Check if a requirement already exists for this specification
      const { data: existingReq, error: existingReqError } = await supabase
        .from("requirements")
        .select("id")
        .eq("specification_id", specificationId)
        .maybeSingle()

      if (!existingReqError && existingReq) {
        // Use existing requirement
        finalRequirementId = existingReq.id
      } else {
        // Create a new requirement linked to this specification
        const { data: newReq, error: newReqError } = await supabase
          .from("requirements")
          .insert({
            project_name: projectName || "Unknown Project",
            project_description: `Data model for ${projectName || "Unknown Project"}`,
            specification_id: specificationId,
          })
          .select()

        if (newReqError) {
          console.error("Error creating requirement:", newReqError)
          // Continue without a requirement ID
        } else {
          finalRequirementId = newReq[0].id
        }
      }
    }

    // Ensure the type is correctly set
    // If type is "data", convert it to "data-model" to ensure consistency
    const finalType = type === "data" ? "data-model" : type

    // Try a simple insert with minimal fields first
    const insertData = {
      diagram_code: diagramCode,
      type: finalType,
      requirement_id: finalRequirementId,
      project_name: projectName || "Unknown Project", // Add the project name
    }

    console.log("Saving design with data:", insertData)

    // Try to insert with just the minimal fields
    const { data, error } = await supabase.from("designs").insert(insertData).select()

    if (error) {
      console.error("Error with minimal insert:", error)

      // If the error is about the table not existing, try to create it
      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        console.log("Designs table doesn't exist. Creating it...")

        // Create the designs table with minimal required columns
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS designs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            diagram_code TEXT NOT NULL,
            type TEXT,
            project_name TEXT,
            requirement_id UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `

        const { error: createError } = await supabase.rpc("exec_sql", { sql: createTableQuery })

        if (createError) {
          console.error("Error creating table:", createError)

          // If we can't create the table with RPC, try a direct insert again
          // This might work if the table was created by another process in the meantime
          const { data: retryData, error: retryError } = await supabase.from("designs").insert(insertData).select()

          if (retryError) {
            return {
              success: false,
              error: `Failed to save design: ${retryError.message}. Table creation also failed: ${createError.message}`,
            }
          }

          return { success: true, data: retryData }
        }

        // Try the insert again after creating the table
        const { data: newData, error: newError } = await supabase.from("designs").insert(insertData).select()

        if (newError) {
          return { success: false, error: `Table created but insert failed: ${newError.message}` }
        }

        return { success: true, data: newData }
      }

      // If the error is about a missing column, try a more basic approach
      if (
        error.message.includes("column") &&
        (error.message.includes("user_id") || error.message.includes("requirement_id"))
      ) {
        console.log("Column error detected. Trying simplified insert...")

        // Try an even more minimal insert
        const { data: basicData, error: basicError } = await supabase
          .from("designs")
          .insert({
            diagram_code: diagramCode,
            type: finalType, // Use the corrected type here too
            project_name: projectName || "Unknown Project", // Still include the project name
          })
          .select()

        if (basicError) {
          return { success: false, error: `Simplified insert also failed: ${basicError.message}` }
        }

        return { success: true, data: basicData }
      }

      return { success: false, error: error.message }
    }

    // Revalidate paths to ensure fresh data
    revalidatePath("/design")
    revalidatePath("/design-list")
    revalidatePath("/code-generation")

    return { success: true, data }
  } catch (error) {
    console.error("Error in saveDesign:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

export async function deleteDesign(id) {
  try {
    const supabaseServer = getSupabaseServer()

    const { error } = await supabaseServer.from("designs").delete().eq("id", id)

    if (error) {
      throw error
    }

    // Revalidate paths to ensure fresh data
    revalidatePath("/design")
    revalidatePath("/design-list")
    revalidatePath("/code-generation")

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error deleting design:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function getDesignById(id) {
  try {
    const supabaseServer = getSupabaseServer()

    const { data, error } = await supabaseServer
      .from("designs")
      .select("*, requirements(project_name)")
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
    console.error("Error fetching design by ID:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function updateDesign(id, { type, diagramCode, requirementId }) {
  try {
    const supabaseServer = getSupabaseServer()

    // Get the project name from the requirement
    let projectName = "Unknown Project"

    if (requirementId) {
      const { data: requirement, error: reqError } = await supabaseServer
        .from("requirements")
        .select("project_name, specification_id")
        .eq("id", requirementId)
        .single()

      if (!reqError && requirement) {
        projectName = requirement.project_name

        // If there's a specification_id, try to get the app_name from there
        if (requirement.specification_id && (projectName === "Unknown Project" || !projectName)) {
          const { data: spec, error: specError } = await supabaseServer
            .from("specifications")
            .select("app_name")
            .eq("id", requirement.specification_id)
            .single()

          if (!specError && spec && spec.app_name) {
            projectName = spec.app_name
          }
        }
      }
    }

    // Ensure the type is correctly set
    // If type is "data", convert it to "data-model" to ensure consistency
    const finalType = type === "data" ? "data-model" : type

    const { data, error } = await supabaseServer
      .from("designs")
      .update({
        type: finalType,
        diagram_code: diagramCode,
        requirement_id: requirementId,
        project_name: projectName, // Update the project name
      })
      .eq("id", id)
      .select()

    if (error) {
      throw error
    }

    // Revalidate paths to ensure fresh data
    revalidatePath("/design")
    revalidatePath(`/design/${id}`)
    revalidatePath("/design-list")
    revalidatePath("/code-generation")

    return {
      success: true,
      data: data[0],
    }
  } catch (error) {
    console.error("Error updating design:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function getRequirementsList() {
  try {
    const supabaseServer = getSupabaseServer()
    const { data, error } = await supabaseServer
      .from("requirements")
      .select("id, project_name")
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error("Error fetching requirements list:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}
