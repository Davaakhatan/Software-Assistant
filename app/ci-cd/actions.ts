"use server"

import { getSupabase } from "@/lib/supabase"

export async function savePipeline({ name, pipelineType, pipelineCode, specificationId, designId = null }) {
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
      })
      .select()

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
    const supabase = getSupabase()

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
    const supabase = getSupabase()

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
