"use server"

import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// Type for the component diagram data
interface ComponentDiagramData {
  type: string
  diagramCode: string
  requirementId: string
}

// Function to create a Supabase client
function createServerSupabaseClient() {
  const cookieStore = cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL and key must be defined")
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
    },
  })
}

// Default user ID for development/unauthenticated scenarios
const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000"

// Function to save a component diagram
export async function saveComponentDiagram(data: ComponentDiagramData) {
  try {
    // Create a Supabase client
    const supabase = createServerSupabaseClient()

    // Try to get the current user, but don't fail if there's no session
    let userId = DEFAULT_USER_ID
    try {
      const { data: userData } = await supabase.auth.getUser()
      userId = userData?.user?.id || DEFAULT_USER_ID
    } catch (authError) {
      console.log("No authentication session, using default user ID:", authError.message)
      // Continue with the default user ID
    }

    // Insert the design into the database
    const insertData = {
      type: data.type,
      diagram_code: data.diagramCode,
      requirement_id: data.requirementId,
      user_id: userId,
    }

    const { data: design, error } = await supabase.from("designs").insert(insertData).select()

    if (error) {
      console.error("Error saving component diagram:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Revalidate the path to update the UI
    revalidatePath("/design/component-diagram")

    return {
      success: true,
      designId: design?.[0]?.id,
      usingDefaultUser: userId === DEFAULT_USER_ID,
    }
  } catch (error) {
    console.error("Error in saveComponentDiagram:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Function to create a requirement for a specification
export async function createRequirementForSpecification(specificationId: string, projectName: string) {
  try {
    // Create a Supabase client
    const supabase = createServerSupabaseClient()

    // Check if a requirement already exists for this specification
    const { data: existingRequirements, error: fetchError } = await supabase
      .from("requirements")
      .select("id")
      .eq("specification_id", specificationId)
      .limit(1)

    if (fetchError) {
      console.error("Error fetching existing requirements:", fetchError)
      return {
        success: false,
        error: fetchError.message,
      }
    }

    // If a requirement exists, return its ID
    if (existingRequirements && existingRequirements.length > 0) {
      return {
        success: true,
        requirementId: existingRequirements[0].id,
      }
    }

    // Try to get the current user, but don't fail if there's no session
    let userId = DEFAULT_USER_ID
    try {
      const { data: userData } = await supabase.auth.getUser()
      userId = userData?.user?.id || DEFAULT_USER_ID
    } catch (authError) {
      console.log("No authentication session, using default user ID:", authError.message)
      // Continue with the default user ID
    }

    // Create a new requirement
    const { data: requirement, error } = await supabase
      .from("requirements")
      .insert({
        project_name: `Component Diagram for ${projectName}`,
        project_description: `Component diagram design for ${projectName}`,
        specification_id: specificationId,
        user_id: userId,
      })
      .select()

    if (error) {
      console.error("Error creating requirement:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      requirementId: requirement[0].id,
      usingDefaultUser: userId === DEFAULT_USER_ID,
    }
  } catch (error) {
    console.error("Error in createRequirementForSpecification:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}
