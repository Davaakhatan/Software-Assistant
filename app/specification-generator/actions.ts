"use server"

import { revalidatePath } from "next/cache"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function getSpecifications() {
  try {
    const supabaseServer = getSupabaseServer()
    const { data, error } = await supabaseServer
      .from("specifications")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error("Error fetching specifications:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function getSpecificationById(id: string) {
  try {
    const supabaseServer = getSupabaseServer()

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return {
        success: false,
        error: "Invalid specification ID format",
      }
    }

    const { data, error } = await supabaseServer.from("specifications").select("*").eq("id", id).single()

    if (error) {
      throw error
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error("Error fetching specification by id:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function deleteSpecification(id: string) {
  try {
    const supabaseServer = getSupabaseServer()

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return {
        success: false,
        error: "Invalid specification ID format",
      }
    }

    // First delete dependent records in the requirements table
    const { error: requirementsDeleteError } = await supabaseServer
      .from("requirements")
      .delete()
      .eq("specification_id", id)

    if (requirementsDeleteError) {
      console.error("Error deleting dependent requirements:", requirementsDeleteError)
      return {
        success: false,
        error: `Failed to delete dependent requirements: ${requirementsDeleteError.message}`,
      }
    }

    // Now delete the specification
    const { error: specDeleteError } = await supabaseServer.from("specifications").delete().eq("id", id)

    if (specDeleteError) {
      throw specDeleteError
    }

    // Revalidate paths
    revalidatePath("/specifications-list")
    revalidatePath("/specifications")

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error deleting specification:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function saveSpecification(specification: any) {
  try {
    const supabaseServer = getSupabaseServer()

    // First, let's try to discover what columns exist in the table
    const { data: tableInfo, error: tableError } = await supabaseServer.from("specifications").select("*").limit(1)

    if (tableError) {
      console.error("Error fetching table structure:", tableError)
    }

    // Start with the most basic fields that are likely to exist
    const basicData = {
      app_name: specification.app_name,
      app_type: specification.app_type,
      app_description: specification.app_description,
    }

    // Try to insert with just the basic fields
    const { data, error } = await supabaseServer.from("specifications").insert(basicData).select()

    if (error) {
      console.error("Error saving specification with basic fields:", error)
      throw error
    }

    // If we get here, the basic insert worked
    console.log("Successfully saved specification with basic fields")

    // Now try to update with additional fields one by one
    const specId = data[0].id

    // Try to update functional_requirements
    try {
      if (specification.functional_requirements) {
        await supabaseServer
          .from("specifications")
          .update({ functional_requirements: specification.functional_requirements })
          .eq("id", specId)
      }
    } catch (e) {
      console.log("functional_requirements column might not exist:", e)
    }

    // Try to update non_functional_requirements
    try {
      if (specification.non_functional_requirements) {
        await supabaseServer
          .from("specifications")
          .update({ non_functional_requirements: specification.non_functional_requirements })
          .eq("id", specId)
      }
    } catch (e) {
      console.log("non_functional_requirements column might not exist:", e)
    }

    // Try to update system_architecture
    try {
      if (specification.system_architecture) {
        await supabaseServer
          .from("specifications")
          .update({ system_architecture: specification.system_architecture })
          .eq("id", specId)
      }
    } catch (e) {
      console.log("system_architecture column might not exist:", e)
    }

    // Try to update database_schema
    try {
      if (specification.database_schema) {
        await supabaseServer
          .from("specifications")
          .update({ database_schema: specification.database_schema })
          .eq("id", specId)
      }
    } catch (e) {
      console.log("database_schema column might not exist:", e)
    }

    // Revalidate paths
    revalidatePath("/specification-generator")
    revalidatePath("/specifications-list")

    return {
      success: true,
      data: data[0],
    }
  } catch (error) {
    console.error("Error saving specification:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save specification",
    }
  }
}
