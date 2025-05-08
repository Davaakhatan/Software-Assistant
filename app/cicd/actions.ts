"use server"

import { getSupabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function savePipeline({
  name,
  pipelineType,
  pipelineCode,
  specificationId,
  designId = null,
  metadata = {},
}) {
  console.log("Saving pipeline with name:", name)
  try {
    const supabase = getSupabase()

    // Save the pipeline
    const { data, error } = await supabase
      .from("pipelines")
      .insert({
        name,
        pipeline_type: pipelineType,
        pipeline_code: pipelineCode,
        specification_id: specificationId,
        design_id: designId,
        metadata,
      })
      .select()

    if (error) {
      console.error("Error saving pipeline:", error)
      return { success: false, error: error.message }
    }

    // Also save to the ci_cd_pipelines table for compatibility
    try {
      await supabase.from("ci_cd_pipelines").insert({
        name,
        project_name: name,
        platform: pipelineType,
        pipeline_type: pipelineType,
        pipeline_code: pipelineCode,
        specification_id: specificationId,
        design_id: designId,
        metadata,
      })
    } catch (e) {
      console.warn("Could not save to ci_cd_pipelines table:", e)
      // Continue anyway since we saved to the main table
    }

    revalidatePath("/cicd")
    revalidatePath("/cicd/saved")
    revalidatePath("/cicd/pipelines-saved")

    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error in savePipeline:", error)
    return { success: false, error: error.message }
  }
}

export async function getPipelines() {
  console.log("Fetching pipelines...")
  try {
    const supabase = getSupabase()

    // Try to get from pipelines table first
    let { data, error } = await supabase.from("pipelines").select("*").order("created_at", { ascending: false })

    // If no data or error, try the ci_cd_pipelines table
    if (!data || data.length === 0 || error) {
      console.log("No data in pipelines table, trying ci_cd_pipelines...")
      const result = await supabase.from("ci_cd_pipelines").select("*").order("created_at", { ascending: false })

      if (!result.error && result.data && result.data.length > 0) {
        data = result.data
        error = null
      }
    }

    if (error) {
      console.error("Error fetching pipelines:", error)
      return { success: false, error: error.message }
    }

    console.log(`Found ${data?.length || 0} pipelines`)
    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error in getPipelines:", error)
    return { success: false, error: error.message }
  }
}

export async function getPipelineById(id) {
  console.log("Fetching pipeline by ID:", id)
  try {
    const supabase = getSupabase()

    // Try to get from pipelines table first
    let { data, error } = await supabase.from("pipelines").select("*").eq("id", id).maybeSingle()

    // If no data or error, try the ci_cd_pipelines table
    if (!data || error) {
      console.log("No data in pipelines table, trying ci_cd_pipelines...")
      const result = await supabase.from("ci_cd_pipelines").select("*").eq("id", id).maybeSingle()

      if (!result.error && result.data) {
        data = result.data
        error = null
      }
    }

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
  console.log("Deleting pipeline with ID:", id)
  try {
    const supabase = getSupabase()

    // Try to delete from both tables
    const promises = [
      supabase.from("pipelines").delete().eq("id", id),
      supabase.from("ci_cd_pipelines").delete().eq("id", id),
    ]

    const results = await Promise.allSettled(promises)

    // Check if at least one deletion was successful
    const anySuccess = results.some((result) => result.status === "fulfilled" && !result.value.error)

    if (!anySuccess) {
      const errors = results
        .filter((r) => r.status === "fulfilled" && r.value.error)
        .map((r) => (r as PromiseFulfilledResult<any>).value.error.message)
        .join(", ")

      console.error("Error deleting pipeline:", errors)
      return { success: false, error: errors }
    }

    revalidatePath("/cicd")
    revalidatePath("/cicd/saved")
    revalidatePath("/cicd/pipelines-saved")

    return { success: true }
  } catch (error) {
    console.error("Error in deletePipeline:", error)
    return { success: false, error: error.message }
  }
}
