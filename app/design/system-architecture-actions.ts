"use server"
import { getSupabaseServer } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

// Type for the system architecture data
interface SystemArchitectureData {
  type: string
  diagramCode: string
  requirementId: string
}

// Function to save a system architecture
export async function saveSystemArchitecture(data: SystemArchitectureData) {
  try {
    // Use the server-side Supabase client with service role key
    const supabase = getSupabaseServer()

    // Insert the design into the database
    const insertData = {
      type: data.type,
      diagram_code: data.diagramCode,
      requirement_id: data.requirementId,
    }

    const { data: design, error } = await supabase.from("designs").insert(insertData).select()

    if (error) {
      console.error("Error saving system architecture:", error)

      // Check if this is an authentication error
      if (error.message && error.message.includes("auth")) {
        return {
          success: false,
          error: "User not authenticated",
        }
      }

      return {
        success: false,
        error: error.message,
      }
    }

    // Revalidate the path to update the UI
    revalidatePath("/design/system-architecture")

    return {
      success: true,
      designId: design?.[0]?.id,
    }
  } catch (error) {
    console.error("Error in saveSystemArchitecture:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Function to create a requirement for a specification
export async function createRequirementForSpecification(specificationId: string, projectName: string) {
  try {
    // Use the server-side Supabase client with service role key
    const supabase = getSupabaseServer()

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

    // Otherwise, create a new requirement
    const { data: requirement, error } = await supabase
      .from("requirements")
      .insert({
        project_name: `System Architecture for ${projectName}`,
        project_description: `System architecture design for ${projectName}`,
        status: "completed",
        priority: "medium",
        specification_id: specificationId,
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
    }
  } catch (error) {
    console.error("Error in createRequirementForSpecification:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Add a function to check the database schema
export async function checkDesignsTableSchema() {
  try {
    const supabase = getSupabaseServer()

    // Try to query the designs table to see if it exists
    const { data, error } = await supabase.from("designs").select("*").limit(1)

    if (error) {
      // If the table doesn't exist, return that info
      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        return {
          success: false,
          error: "The designs table does not exist yet. It will be created when you save a design.",
          tableExists: false,
        }
      }

      return {
        success: false,
        error: error.message,
        tableExists: false,
      }
    }

    // If we got here, the table exists
    return {
      success: true,
      tableExists: true,
      message: "The designs table exists and is ready to use.",
    }
  } catch (error) {
    console.error("Error checking schema:", error)
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
      tableExists: false,
    }
  }
}

// Add a helper function to execute SQL directly
export async function executeSql(sql: string) {
  try {
    const supabase = getSupabaseServer()

    // This is a workaround since we can't execute arbitrary SQL directly
    // We'll create a temporary function to execute our SQL
    const functionName = `temp_exec_${Math.random().toString(36).substring(2, 15)}`

    const createFunctionSql = `
    CREATE OR REPLACE FUNCTION ${functionName}()
    RETURNS VOID AS $
    BEGIN
      ${sql}
    END;
    $ LANGUAGE plpgsql SECURITY DEFINER;
  `

    // Create the function
    const { error: createError } = await supabase.rpc("exec_sql", { sql: createFunctionSql })

    if (createError) {
      console.error("Error creating function:", createError)
      return { success: false, error: createError.message }
    }

    // Execute the function
    const { error: execError } = await supabase.rpc(functionName)

    if (execError) {
      console.error("Error executing SQL:", execError)
      return { success: false, error: execError.message }
    }

    // Drop the function
    const dropFunctionSql = `DROP FUNCTION IF EXISTS ${functionName}();`
    await supabase.rpc("exec_sql", { sql: dropFunctionSql })

    return { success: true }
  } catch (error) {
    console.error("Error executing SQL:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}
