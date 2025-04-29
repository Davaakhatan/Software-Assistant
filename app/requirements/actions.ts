"use server"

import { getSupabaseServer } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

// Add this UUID validation function at the top of the file
function isValidUUID(id) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export async function saveRequirements(formData) {
  try {
    const supabaseServer = getSupabaseServer()
    // First, create a new requirements entry
    const { data: requirementData, error: requirementError } = await supabaseServer
      .from("requirements")
      .insert({
        project_name: formData.projectName,
        project_description: formData.projectDescription,
        specification_id: formData.specificationId, // Link to specification if provided
      })
      .select()

    if (requirementError) {
      throw requirementError
    }

    const requirementId = requirementData[0].id

    // Save user stories
    if (formData.userStories && formData.userStories.length > 0) {
      const userStoriesWithRequirementId = formData.userStories.map((story) => ({
        requirement_id: requirementId,
        role: story.role,
        action: story.action,
        benefit: story.benefit,
        priority: story.priority,
      }))

      const { error: userStoriesError } = await supabaseServer.from("user_stories").insert(userStoriesWithRequirementId)

      if (userStoriesError) {
        throw userStoriesError
      }
    }

    // Save functional requirements
    if (formData.functionalRequirements && formData.functionalRequirements.length > 0) {
      const functionalRequirementsWithId = formData.functionalRequirements.map((req) => ({
        requirement_id: requirementId,
        description: req.description,
        priority: req.priority,
      }))

      const { error: functionalReqError } = await supabaseServer
        .from("functional_requirements")
        .insert(functionalRequirementsWithId)

      if (functionalReqError) {
        throw functionalReqError
      }
    }

    revalidatePath("/requirements")
    revalidatePath("/requirements-list")

    return {
      success: true,
      data: requirementData[0],
    }
  } catch (error) {
    console.error("Error saving requirements:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function updateRequirements(id, formData) {
  try {
    const supabaseServer = getSupabaseServer()
    if (!isValidUUID(id)) {
      return {
        success: false,
        error: "Invalid requirement ID format",
      }
    }

    // Update the requirements entry
    const { data: requirementData, error: requirementError } = await supabaseServer
      .from("requirements")
      .update({
        project_name: formData.projectName,
        project_description: formData.projectDescription,
        specification_id: formData.specificationId, // Update specification link
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (requirementError) {
      throw requirementError
    }

    // Delete existing user stories
    const { error: deleteUserStoriesError } = await supabaseServer
      .from("user_stories")
      .delete()
      .eq("requirement_id", id)

    if (deleteUserStoriesError) {
      throw deleteUserStoriesError
    }

    // Delete existing functional requirements
    const { error: deleteFunctionalReqError } = await supabaseServer
      .from("functional_requirements")
      .delete()
      .eq("requirement_id", id)

    if (deleteFunctionalReqError) {
      throw deleteFunctionalReqError
    }

    // Save new user stories
    if (formData.userStories && formData.userStories.length > 0) {
      const userStoriesWithRequirementId = formData.userStories.map((story) => ({
        requirement_id: id,
        role: story.role,
        action: story.action,
        benefit: story.benefit,
        priority: story.priority,
      }))

      const { error: userStoriesError } = await supabaseServer.from("user_stories").insert(userStoriesWithRequirementId)

      if (userStoriesError) {
        throw userStoriesError
      }
    }

    // Save new functional requirements
    if (formData.functionalRequirements && formData.functionalRequirements.length > 0) {
      const functionalRequirementsWithId = formData.functionalRequirements.map((req) => ({
        requirement_id: id,
        description: req.project_description,
        priority: req.priority,
      }))

      const { error: functionalReqError } = await supabaseServer
        .from("functional_requirements")
        .insert(functionalRequirementsWithId)

      if (functionalReqError) {
        throw functionalReqError
      }
    }

    revalidatePath("/requirements")
    revalidatePath(`/requirements/${id}`)
    revalidatePath("/requirements-list")

    return {
      success: true,
      data: requirementData[0],
    }
  } catch (error) {
    console.error("Error updating requirements:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Update the deleteRequirement function to handle cascading deletes properly

export async function deleteRequirement(id) {
  try {
    const supabaseServer = getSupabaseServer()
    if (!isValidUUID(id)) {
      return {
        success: false,
        error: "Invalid requirement ID format",
      }
    }

    // First delete related user stories
    const { error: userStoriesError } = await supabaseServer.from("user_stories").delete().eq("requirement_id", id)

    if (userStoriesError) {
      throw userStoriesError
    }

    // Then delete related functional requirements
    const { error: functionalReqError } = await supabaseServer
      .from("functional_requirements")
      .delete()
      .eq("requirement_id", id)

    if (functionalReqError) {
      throw functionalReqError
    }

    // Finally delete the requirement itself
    const { error } = await supabaseServer.from("requirements").delete().eq("id", id)

    if (error) {
      throw error
    }

    revalidatePath("/requirements")
    revalidatePath("/requirements-list")

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error deleting requirement:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function getRequirements() {
  try {
    const supabaseServer = getSupabaseServer()
    const { data, error } = await supabaseServer
      .from("requirements")
      .select("*, specifications(app_name)")
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error("Error fetching requirements:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function getRequirementDetails(id) {
  try {
    const supabaseServer = getSupabaseServer()
    // Validate UUID format
    if (!isValidUUID(id)) {
      return {
        success: false,
        error: "Invalid requirement ID format",
      }
    }

    // Get the requirement
    const { data: requirement, error: requirementError } = await supabaseServer
      .from("requirements")
      .select("*, specifications(id, app_name)")
      .eq("id", id)
      .single()

    if (requirementError) {
      throw requirementError
    }

    // Get user stories
    const { data: userStories, error: userStoriesError } = await supabaseServer
      .from("user_stories")
      .select("*")
      .eq("requirement_id", id)

    if (userStoriesError) {
      throw userStoriesError
    }

    // Get functional requirements
    const { data: functionalRequirements, error: functionalReqError } = await supabaseServer
      .from("functional_requirements")
      .select("*")
      .eq("requirement_id", id)

    if (functionalReqError) {
      throw functionalReqError
    }

    return {
      success: true,
      data: {
        requirement,
        userStories,
        functionalRequirements,
      },
    }
  } catch (error) {
    console.error("Error fetching requirement details:", error)
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
