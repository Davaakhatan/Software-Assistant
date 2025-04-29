"use server"

import { getSupabaseServer } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

// Function to validate UUID format
function isValidUUID(id: string | null | undefined): boolean {
  if (!id) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export async function savePipeline({ name, pipelineType, pipelineCode, specificationId, designId = null, metadata }) {
  try {
    const supabase = getSupabaseServer()

    // Prepare the insert data WITHOUT project_id to avoid foreign key constraint
    const insertData = {
      name: name,
      pipeline_type: pipelineType,
      pipeline_code: pipelineCode,
      specification_id: specificationId,
      design_id: designId,
      metadata: metadata,
    }

    // Save the pipeline
    const { data, error } = await supabase.from("pipelines").insert([insertData]).select()

    if (error) {
      console.error("Error saving pipeline:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error in savePipeline:", error)
    return { success: false, error: error.message }
  }
}

export async function getPipelines() {
  try {
    const supabase = getSupabaseServer()

    const { data, error } = await supabase.from("pipelines").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching pipelines:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in getPipelines:", error)
    return { success: false, error: error.message }
  }
}

export async function getPipelineById(id) {
  try {
    const supabase = getSupabaseServer()

    const { data, error } = await supabase.from("pipelines").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching pipeline by ID:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in getPipelineById:", error)
    return { success: false, error: error.message }
  }
}

export async function deletePipeline(id) {
  try {
    const supabase = getSupabaseServer()

    const { error } = await supabase.from("pipelines").delete().eq("id", id)

    if (error) {
      console.error("Error deleting pipeline:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/cicd")
    return {
      success: true,
    }
  } catch (error) {
    console.error("Error deleting pipeline:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}
