"use server"

import { getSupabase } from "@/lib/supabase"

export async function saveDocumentation({
  name,
  documentationType,
  documentationContent,
  specificationId,
  designId = null,
}) {
  try {
    const supabase = getSupabase()

    // Save the documentation
    const { data, error } = await supabase
      .from("documentation")
      .insert({
        name,
        documentation_type: documentationType,
        documentation_content: documentationContent,
        specification_id: specificationId,
        design_id: designId,
      })
      .select()

    if (error) {
      console.error("Error saving documentation:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error in saveDocumentation:", error)
    return { success: false, error: error.message }
  }
}

export async function getDocumentation() {
  try {
    const supabase = getSupabase()

    const { data, error } = await supabase.from("documentation").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching documentation:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in getDocumentation:", error)
    return { success: false, error: error.message }
  }
}

export async function getDocumentationById(id) {
  try {
    const supabase = getSupabase()

    const { data, error } = await supabase.from("documentation").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching documentation by ID:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in getDocumentationById:", error)
    return { success: false, error: error.message }
  }
}
