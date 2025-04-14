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

    // Save the design
    const { data, error } = await supabase
      .from("designs")
      .insert({
        type,
        diagram_code: diagramCode,
        requirement_id: requirementId,
        user_id: userId,
      })
      .select()

    if (error) {
      console.error("Error saving design:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in saveComponentDiagram:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}
