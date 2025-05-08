"use server"

import { getSupabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

// Simplified function to check if a table exists by directly querying it
async function checkTableExists(tableName: string) {
  try {
    const supabase = getSupabase()

    // Simply try to query the table directly
    const { error } = await supabase.from(tableName).select("id").limit(1)

    // If there's no error, the table exists
    if (!error) {
      return true
    }

    // If the error indicates the table doesn't exist, return false
    if (error.message.includes("does not exist") || error.code === "42P01") {
      return false
    }

    // For other errors, log and return false to be safe
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  } catch (error) {
    console.error(`Error in checkTableExists for ${tableName}:`, error)
    return false
  }
}

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

    // Check if the ci_cd_pipelines table exists
    const tableExists = await checkTableExists("ci_cd_pipelines")

    if (!tableExists) {
      console.error("ci_cd_pipelines table doesn't exist")
      return {
        success: false,
        error: "Database table not set up. Please go to the setup page to create the required table.",
        needsSetup: true,
      }
    }

    // Save to the ci_cd_pipelines table using the existing structure
    const { data, error } = await supabase
      .from("ci_cd_pipelines")
      .insert({
        name,
        project_name: name, // Using name for project_name as well
        platform: pipelineType,
        pipeline_type: pipelineType,
        pipeline_code: pipelineCode,
        specification_id: specificationId,
        designid: designId, // Note: using designid (lowercase) to match your table structure
        metadata,
        generated_config: pipelineCode, // For backward compatibility with your existing table
      })
      .select()

    if (error) {
      console.error("Error saving pipeline:", error)
      return { success: false, error: error.message || JSON.stringify(error) }
    }

    revalidatePath("/cicd")
    revalidatePath("/cicd/saved")
    revalidatePath("/cicd/pipelines-saved")

    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error in savePipeline:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function getPipelines() {
  console.log("Fetching pipelines...")
  try {
    const supabase = getSupabase()

    // Check if the ci_cd_pipelines table exists
    const tableExists = await checkTableExists("ci_cd_pipelines")

    if (!tableExists) {
      console.log("ci_cd_pipelines table doesn't exist")
      return { success: true, data: [], needsSetup: true }
    }

    // Get all pipelines from the ci_cd_pipelines table
    const { data, error } = await supabase.from("ci_cd_pipelines").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching pipelines:", error)
      return { success: false, error: error.message }
    }

    // Map the data to ensure consistent field names if needed
    const mappedData = data.map((pipeline) => ({
      ...pipeline,
      // Ensure pipeline_code exists (use generated_config as fallback)
      pipeline_code: pipeline.pipeline_code || pipeline.generated_config,
      // Ensure design_id exists (use designid as fallback)
      design_id: pipeline.design_id || pipeline.designid,
    }))

    console.log(`Found ${mappedData.length} pipelines`)
    return { success: true, data: mappedData }
  } catch (error) {
    console.error("Error in getPipelines:", error)
    return { success: false, error: error.message, needsSetup: true }
  }
}

export async function getPipelineById(id) {
  console.log("Fetching pipeline by ID:", id)
  try {
    const supabase = getSupabase()

    // Check if the ci_cd_pipelines table exists
    const tableExists = await checkTableExists("ci_cd_pipelines")

    if (!tableExists) {
      console.log("ci_cd_pipelines table doesn't exist")
      return { success: false, error: "Pipeline table doesn't exist", needsSetup: true }
    }

    // Get the pipeline from the ci_cd_pipelines table
    const { data, error } = await supabase.from("ci_cd_pipelines").select("*").eq("id", id).maybeSingle()

    if (error) {
      console.error("Error fetching pipeline by ID:", error)
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: "Pipeline not found" }
    }

    // Map the data to ensure consistent field names if needed
    const mappedData = {
      ...data,
      // Ensure pipeline_code exists (use generated_config as fallback)
      pipeline_code: data.pipeline_code || data.generated_config,
      // Ensure design_id exists (use designid as fallback)
      design_id: data.design_id || data.designid,
    }

    return { success: true, data: mappedData }
  } catch (error) {
    console.error("Error in getPipelineById:", error)
    return { success: false, error: error.message }
  }
}

export async function deletePipeline(id) {
  console.log("Deleting pipeline with ID:", id)
  try {
    const supabase = getSupabase()

    // Check if the ci_cd_pipelines table exists
    const tableExists = await checkTableExists("ci_cd_pipelines")

    if (!tableExists) {
      console.log("ci_cd_pipelines table doesn't exist")
      return { success: false, error: "Pipeline table doesn't exist", needsSetup: true }
    }

    // Delete the pipeline from the ci_cd_pipelines table
    const { error } = await supabase.from("ci_cd_pipelines").delete().eq("id", id)

    if (error) {
      console.error("Error deleting pipeline:", error)
      return { success: false, error: error.message }
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
