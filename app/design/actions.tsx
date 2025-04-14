"use server"

import { getSupabaseServer } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

export async function getDesigns() {
  try {
    const supabaseServer = getSupabaseServer()
    const { data, error } = await supabaseServer
      .from("designs")
      .select("*, requirements(project_name)")
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

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

export async function saveDesign({ type, diagramCode, requirementId }) {
  try {
    const supabaseServer = getSupabaseServer()

    const { data, error } = await supabaseServer
      .from("designs")
      .insert({
        type,
        diagram_code: diagramCode,
        requirement_id: requirementId,
      })
      .select()

    if (error) {
      throw error
    }

    revalidatePath("/design")
    revalidatePath("/design-list")

    return {
      success: true,
      data: data[0],
    }
  } catch (error) {
    console.error("Error saving design:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function deleteDesign(id) {
  try {
    const supabaseServer = getSupabaseServer()

    const { error } = await supabaseServer.from("designs").delete().eq("id", id)

    if (error) {
      throw error
    }

    revalidatePath("/design")
    revalidatePath("/design-list")

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

    const { data, error } = await supabaseServer
      .from("designs")
      .update({
        type,
        diagram_code: diagramCode,
        project_id: requirementId,
      })
      .eq("id", id)
      .select()

    if (error) {
      throw error
    }

    revalidatePath("/design")
    revalidatePath(`/design/${id}`)
    revalidatePath("/design-list")

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
