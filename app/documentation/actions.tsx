"use server"

import { getSupabaseServer } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

export async function saveDocumentation(documentation) {
  try {
    const supabaseServer = getSupabaseServer()

    const { data, error } = await supabaseServer
      .from("documentations")
      .insert([
        {
          project_id: documentation.specificationId || null,
          doc_type: documentation.documentationType || "general",
          project_name: documentation.name || "Untitled",
          project_description: documentation.projectDescription || "",
          generated_docs: documentation.documentationContent || "",
        },
      ])
      .select()

    if (error) {
      console.error("Error saving documentation:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/documentation")
    revalidatePath("/documentation-list")

    return {
      success: true,
      data: data[0],
    }
  } catch (error) {
    console.error("Error saving documentation:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function getDocumentation() {
  try {
    const supabaseServer = getSupabaseServer()
    const { data, error } = await supabaseServer
      .from("documentations")
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
    console.error("Error fetching documentation:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}
