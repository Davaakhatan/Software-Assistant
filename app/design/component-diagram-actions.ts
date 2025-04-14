"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function createRequirementForSpecification(specificationId: string, projectName: string) {
  try {
    // Use the server-side Supabase client to bypass RLS
    const supabase = getSupabaseServer()

    // Check if a requirement already exists for this specification
    const { data: existingReq, error: existingReqError } = await supabase
      .from("requirements")
      .select("id")
      .eq("specification_id", specificationId)
      .maybeSingle()

    if (existingReqError) {
      console.error("Error checking for existing requirement:", existingReqError)
      return { success: false, error: existingReqError.message }
    }

    if (existingReq) {
      // Use existing requirement
      return { success: true, requirementId: existingReq.id }
    } else {
      // Create a new requirement linked to this specification
      const { data: newReq, error: newReqError } = await supabase
        .from("requirements")
        .insert({
          project_name: projectName,
          project_description: `Auto-generated from specification: ${projectName}`,
          specification_id: specificationId,
        })
        .select()

      if (newReqError) {
        console.error("Error creating new requirement:", newReqError)
        return { success: false, error: newReqError.message }
      }

      return { success: true, requirementId: newReq[0].id }
    }
  } catch (error) {
    console.error("Error in createRequirementForSpecification:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

export async function saveComponentDiagram({ type, diagramCode, requirementId }) {
  try {
    // Use the server-side Supabase client to bypass RLS
    const supabase = getSupabaseServer()

    // Get the current user
    const authClient = createServerComponentClient({ cookies })
    const {
      data: { user },
    } = await authClient.auth.getUser()

    // For development purposes, create a default user ID if not authenticated
    const userId = user?.id || "00000000-0000-0000-0000-000000000000" // Default user ID for development

    // Create a base insert object with required fields
    const insertData = {
      type,
      diagram_code: diagramCode,
    }

    // Add optional fields if they exist in the schema
    if (requirementId) {
      insertData["requirement_id"] = requirementId
    }

    // Try to insert with minimal required fields first
    const { data, error } = await supabase.from("designs").insert(insertData).select()

    if (error) {
      console.error("Error saving design:", error)

      // If the error is about missing columns, try a more basic approach
      if (
        error.message.includes("column") &&
        (error.message.includes("user_id") || error.message.includes("requirement_id"))
      ) {
        console.log("Column error detected. Trying simplified insert...")

        // Try an even more minimal insert with just the diagram code and type
        const { data: basicData, error: basicError } = await supabase
          .from("designs")
          .insert({
            diagram_code: diagramCode,
            type: type || "component",
          })
          .select()

        if (basicError) {
          // If the table doesn't exist, we might need to create it
          if (basicError.message.includes("relation") && basicError.message.includes("does not exist")) {
            console.log("Designs table doesn't exist. Please run the setup SQL first.")
            return {
              success: false,
              error: "The designs table does not exist. Please visit the /design page first to set up the database.",
            }
          }

          return { success: false, error: `Simplified insert also failed: ${basicError.message}` }
        }

        return { success: true, data: basicData }
      }

      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in saveComponentDiagram:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}
