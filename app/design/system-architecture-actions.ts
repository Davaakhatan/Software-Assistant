"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function createRequirementForSpecification(specificationId: string, projectName: string) {
  try {
    // Use the server-side Supabase client to bypass RLS
    const supabase = getSupabaseServer()

    // Check if a requirement already exists for this specification
    const { data: existingReq, error: existingReqError } = await supabase
      .from("requirements")
      .select("id")
      .eq("specification_id", specificationId)
      .maybeSingle()

    if (existingReqError) {
      console.error("Error checking for existing requirement:", existingReqError)
      return { success: false, error: existingReqError.message }
    }

    if (existingReq) {
      // Use existing requirement
      return { success: true, requirementId: existingReq.id }
    } else {
      // Create a new requirement linked to this specification
      const { data: newReq, error: newReqError } = await supabase
        .from("requirements")
        .insert({
          project_name: projectName,
          project_description: `Auto-generated from specification: ${projectName}`,
          specification_id: specificationId,
        })
        .select()

      if (newReqError) {
        console.error("Error creating new requirement:", newReqError)
        return { success: false, error: newReqError.message }
      }

      return { success: true, requirementId: newReq[0].id }
    }
  } catch (error) {
    console.error("Error in createRequirementForSpecification:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

export async function saveSystemArchitecture({ type, diagramCode, requirementId }) {
  try {
    // Use the server-side Supabase client to bypass RLS
    const supabase = getSupabaseServer()

    // Get the current user
    const authClient = createServerComponentClient({ cookies })
    const {
      data: { user },
    } = await authClient.auth.getUser()

    // For development: use a default user ID if no user is authenticated
    const userId = user?.id || "00000000-0000-0000-0000-000000000000" // Default user ID for development

    // Log authentication status for debugging
    if (!user) {
      console.log("No authenticated user found. Using default user ID for development.")
    }

    // Get the project name from the requirement or specification
    let projectName = "Unknown Project"

    if (requirementId) {
      const { data: requirement, error: reqError } = await supabase
        .from("requirements")
        .select("project_name, specification_id")
        .eq("id", requirementId)
        .single()

      if (!reqError && requirement) {
        projectName = requirement.project_name

        // If there's a specification_id, try to get the app_name from there
        if (requirement.specification_id && (projectName === "Unknown Project" || !projectName)) {
          const { data: spec, error: specError } = await supabase
            .from("specifications")
            .select("app_name")
            .eq("id", requirement.specification_id)
            .single()

          if (!specError && spec && spec.app_name) {
            projectName = spec.app_name
            console.log("Using app_name from specification:", projectName)
          }
        }
      }
    }

    // Try a simple insert with minimal fields first
    const insertData = {
      diagram_code: diagramCode,
      type: type || "architecture",
      requirement_id: requirementId,
      project_name: projectName, // Add the project name
    }

    console.log("Saving system architecture with project name:", projectName)

    // Try to insert with just the minimal fields
    const { data, error } = await supabase.from("designs").insert(insertData).select()

    if (error) {
      console.error("Error with minimal insert:", error)

      // If the error is about the table not existing, try to create it
      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        console.log("Designs table doesn't exist. Creating it...")

        // Create the designs table with minimal required columns
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS designs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            diagram_code TEXT NOT NULL,
            type TEXT,
            project_name TEXT,
            requirement_id UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `

        const { error: createError } = await supabase.rpc("exec_sql", { sql: createTableQuery })

        if (createError) {
          console.error("Error creating table:", createError)

          // If we can't create the table with RPC, try a direct insert again
          // This might work if the table was created by another process in the meantime
          const { data: retryData, error: retryError } = await supabase.from("designs").insert(insertData).select()

          if (retryError) {
            return {
              success: false,
              error: `Failed to save design: ${retryError.message}. Table creation also failed: ${createError.message}`,
            }
          }

          return { success: true, data: retryData }
        }

        // Try the insert again after creating the table
        const { data: newData, error: newError } = await supabase.from("designs").insert(insertData).select()

        if (newError) {
          return { success: false, error: `Table created but insert failed: ${newError.message}` }
        }

        return { success: true, data: newData }
      }

      // If the error is about a missing column, try a more basic approach
      if (
        error.message.includes("column") &&
        (error.message.includes("user_id") || error.message.includes("requirement_id"))
      ) {
        console.log("Column error detected. Trying simplified insert...")

        // Try an even more minimal insert
        const { data: basicData, error: basicError } = await supabase
          .from("designs")
          .insert({
            diagram_code: diagramCode,
            project_name: projectName, // Still include the project name
          })
          .select()

        if (basicError) {
          return { success: false, error: `Simplified insert also failed: ${basicError.message}` }
        }

        return { success: true, data: basicData }
      }

      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in saveSystemArchitecture:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
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
