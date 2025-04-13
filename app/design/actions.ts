"use server"

import { revalidatePath } from "next/cache"
import { validate as uuidValidate, version as uuidVersion } from "uuid"
import { getSupabaseServer } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"

function isValidUUID(uuid) {
  if (!uuid) {
    return false
  }

  if (typeof uuid !== "string") {
    return false
  }

  return uuidValidate(uuid) && uuidVersion(uuid) === 4
}

// Update the saveDesign function to handle the foreign key constraint
export async function saveDesign(data) {
  try {
    const supabaseServer = getSupabaseServer()
    const { type, diagramCode, requirementId } = data

    if (!isValidUUID(requirementId)) {
      return {
        success: false,
        error: "Invalid requirement ID format",
      }
    }

    // First, check if the requirement exists
    const { data: requirement, error: requirementError } = await supabaseServer
      .from("requirements")
      .select("id")
      .eq("id", requirementId)
      .single()

    if (requirementError) {
      console.error("Requirement check error:", requirementError)
      return {
        success: false,
        error: `Requirement not found: ${requirementError.message}`,
      }
    }

    // Create a project for this requirement if it doesn't exist
    let projectId = null
    try {
      // Check if a project already exists for this requirement
      const { data: existingProject, error: existingProjectError } = await supabaseServer
        .from("projects")
        .select("id")
        .eq("requirement_id", requirementId)
        .maybeSingle()

      if (!existingProjectError && existingProject) {
        projectId = existingProject.id
      } else {
        // Create a new project
        const { data: newProject, error: newProjectError } = await supabaseServer
          .from("projects")
          .insert({
            requirement_id: requirementId,
            name: `Project for requirement ${requirementId}`,
          })
          .select()

        if (!newProjectError && newProject && newProject.length > 0) {
          projectId = newProject[0].id
        }
      }
    } catch (projectError) {
      console.error("Error with projects table:", projectError)
      // Continue without a project ID
    }

    // Now try to insert the design with project_id
    if (projectId) {
      try {
        const { data: designData, error } = await supabaseServer
          .from("designs")
          .insert({
            type,
            diagram_code: diagramCode,
            project_id: projectId,
          })
          .select()

        if (!error) {
          revalidatePath("/design")
          return {
            success: true,
            data: designData[0],
          }
        } else {
          console.error("Insert with project_id failed:", error)
          throw error
        }
      } catch (insertError) {
        console.error("Insert with project_id failed:", insertError)
        throw insertError
      }
    } else {
      // If we couldn't create or find a project, try a direct insert without foreign keys
      try {
        const { data: designData, error } = await supabaseServer
          .from("designs")
          .insert({
            type,
            diagram_code: diagramCode,
          })
          .select()

        if (error) {
          throw error
        }

        revalidatePath("/design")
        return {
          success: true,
          data: designData[0],
        }
      } catch (finalError) {
        console.error("Final insert attempt failed:", finalError)
        throw finalError
      }
    }
  } catch (error) {
    console.error("Error saving design:", error)
    return {
      success: false,
      error: `Error saving design: ${error.message}`,
    }
  }
}

// Update the other functions to use getSupabaseServer()
export async function updateDesign(id, data) {
  try {
    const supabaseServer = getSupabaseServer()
    const { type, diagramCode, requirementId } = data

    if (!isValidUUID(id)) {
      return {
        success: false,
        error: "Invalid design ID format",
      }
    }

    // Get the current design to see what fields it has
    const { data: currentDesign, error: getError } = await supabaseServer
      .from("designs")
      .select("*")
      .eq("id", id)
      .single()

    if (getError) {
      throw getError
    }

    // Create a project for this requirement if it doesn't exist
    let projectId = null
    try {
      // Check if a project already exists for this requirement
      const { data: existingProject, error: existingProjectError } = await supabaseServer
        .from("projects")
        .select("id")
        .eq("requirement_id", requirementId)
        .maybeSingle()

      if (!existingProjectError && existingProject) {
        projectId = existingProject.id
      } else {
        // Create a new project
        const { data: newProject, error: newProjectError } = await supabaseServer
          .from("projects")
          .insert({
            requirement_id: requirementId,
            name: `Project for requirement ${requirementId}`,
          })
          .select()

        if (!newProjectError && newProject && newProject.length > 0) {
          projectId = newProject[0].id
        }
      }
    } catch (projectError) {
      console.error("Error with projects table:", projectError)
      // Continue without a project ID
    }

    // Prepare update data
    const updateData = {
      type,
      diagram_code: diagramCode,
    }

    // Only include project_id if we have one
    if (projectId) {
      updateData.project_id = projectId
    }

    const { data: designData, error } = await supabaseServer.from("designs").update(updateData).eq("id", id).select()

    if (error) {
      throw error
    }

    revalidatePath("/design")
    revalidatePath(`/design/${id}`)
    revalidatePath("/design-list")

    return {
      success: true,
      data: designData[0],
    }
  } catch (error) {
    console.error("Error updating design:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function deleteDesign(id) {
  try {
    const supabaseServer = getSupabaseServer()
    if (!isValidUUID(id)) {
      return {
        success: false,
        error: "Invalid design ID format",
      }
    }

    // First, check if there are any tables that reference this design
    // For example, check if there are code_generations that reference this design
    try {
      const { data: codeGenerations, error: codeGenError } = await supabaseServer
        .from("code_generations")
        .select("id")
        .eq("design_id", id)

      if (!codeGenError && codeGenerations && codeGenerations.length > 0) {
        // Delete the code generations that reference this design
        const { error: deleteCodeGenError } = await supabaseServer.from("code_generations").delete().eq("design_id", id)

        if (deleteCodeGenError) {
          console.error("Error deleting related code generations:", deleteCodeGenError)
          return {
            success: false,
            error: `Error deleting related code generations: ${deleteCodeGenError.message}`,
          }
        }
      }
    } catch (relatedError) {
      console.error("Error checking for related code generations:", relatedError)
      // Continue with deletion attempt even if this check fails
    }

    // Check for other potential relationships
    try {
      const { data: testCases, error: testCasesError } = await supabaseServer
        .from("test_cases")
        .select("id")
        .eq("design_id", id)

      if (!testCasesError && testCases && testCases.length > 0) {
        // Delete the test cases that reference this design
        const { error: deleteTestCasesError } = await supabaseServer.from("test_cases").delete().eq("design_id", id)

        if (deleteTestCasesError) {
          console.error("Error deleting related test cases:", deleteTestCasesError)
          return {
            success: false,
            error: `Error deleting related test cases: ${deleteTestCasesError.message}`,
          }
        }
      }
    } catch (relatedError) {
      console.error("Error checking for related test cases:", relatedError)
      // Continue with deletion attempt even if this check fails
    }

    // Now attempt to delete the design
    const { error } = await supabaseServer.from("designs").delete().eq("id", id)

    if (error) {
      // If we still get a foreign key constraint error, log it with more details
      console.error("Error deleting design:", error)

      // If it's a foreign key constraint error, provide more helpful information
      if (error.code === "23503") {
        // PostgreSQL foreign key constraint violation code
        return {
          success: false,
          error: `Foreign key constraint violation: ${error.message}. Please delete related records first.`,
        }
      }

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

export async function getDesigns() {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from("designs").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching designs:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in getDesigns:", error)
    return { success: false, error: "Failed to fetch designs" }
  }
}

// Simplified version of getDesignsByRequirementId that tries multiple approaches
export async function getDesignsByRequirementId(requirementId: string) {
  try {
    const supabase = getSupabase()
    if (!isValidUUID(requirementId)) {
      return {
        success: false,
        error: "Invalid requirement ID format",
      }
    }

    // Approach 1: Try direct requirement_id link (if it exists)
    try {
      const { data, error } = await supabase
        .from("designs")
        .select("*")
        .eq("requirement_id", requirementId)
        .order("created_at", { ascending: false })

      // If this works and returns data, use it
      if (!error && data && data.length > 0) {
        console.log(`Found ${data.length} designs directly linked to requirement ID: ${requirementId}`)
        return { success: true, data }
      }
    } catch (directLinkError) {
      // Ignore error - this column might not exist
      console.log("Direct requirement_id link not available, trying other approaches")
    }

    // Approach 2: Try through projects table (if it exists)
    try {
      // Find projects for this requirement
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("id")
        .eq("requirement_id", requirementId)

      if (!projectsError && projectsData && projectsData.length > 0) {
        const projectIds = projectsData.map((project) => project.id)

        // Get designs linked to these projects
        const { data, error } = await supabase
          .from("designs")
          .select("*")
          .in("project_id", projectIds)
          .order("created_at", { ascending: false })

        if (!error && data && data.length > 0) {
          console.log(`Found ${data.length} designs through projects for requirement ID: ${requirementId}`)
          return { success: true, data }
        }
      }
    } catch (projectLinkError) {
      // Ignore error - this relationship might not exist
      console.log("Project-based link not available, using fallback")
    }

    // Fallback: Return all designs
    console.log("Using fallback: returning all designs")
    const { data, error } = await supabase.from("designs").select("*").order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return {
      success: true,
      data,
      message: "Returning all designs as fallback - could not determine relationship to requirements",
    }
  } catch (error) {
    console.error("Error in getDesignsByRequirementId:", error)
    return { success: false, error: "Failed to fetch designs for this requirement" }
  }
}

export async function getDesignById(id) {
  try {
    const supabaseServer = getSupabaseServer()
    // Validate UUID format
    if (!isValidUUID(id)) {
      return {
        success: false,
        error: "Invalid design ID format",
      }
    }

    // Use a simpler query without the join
    const { data, error } = await supabaseServer.from("designs").select("*").eq("id", id).single()

    if (error) {
      throw error
    }

    // If the design has a project_id, fetch the project name separately
    if (data && data.project_id) {
      const { data: projectData, error: projectError } = await supabaseServer
        .from("projects")
        .select("id, name, requirement_id")
        .eq("id", data.project_id)
        .single()

      if (!projectError && projectData) {
        data.project_name = projectData.name

        // If the project has a requirement_id, try to get the requirement name
        if (projectData.requirement_id) {
          data.requirement_id = projectData.requirement_id

          const { data: requirementData, error: requirementError } = await supabaseServer
            .from("requirements")
            .select("id, project_name")
            .eq("id", projectData.requirement_id)
            .single()

          if (!requirementError && requirementData) {
            // Use the requirement's project_name if we don't already have a project name
            if (!data.project_name) {
              data.project_name = requirementData.project_name
            }
          }
        }
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error("Error fetching design by id:", error)
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

export async function getRequirementDetails(id) {
  try {
    const supabaseServer = getSupabaseServer()
    if (!isValidUUID(id)) {
      return {
        success: false,
        error: "Invalid requirement ID format",
      }
    }

    const { data: requirement, error: requirementError } = await supabaseServer
      .from("requirements")
      .select("*, specifications(id, app_name)")
      .eq("id", id)
      .single()

    if (requirementError) {
      throw requirementError
    }

    const { data: userStories, error: userStoriesError } = await supabaseServer
      .from("user_stories")
      .select("*")
      .eq("requirement_id", id)

    if (userStoriesError) {
      throw userStoriesError
    }

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
