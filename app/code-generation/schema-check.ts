"use server"

import { getSupabase } from "@/lib/supabase"

export async function checkGeneratedCodeSchema() {
  try {
    const supabase = getSupabase()

    // Query a single row to see the column names
    const { data, error } = await supabase.from("generated_code").select("*").limit(1)

    if (error) {
      console.error("Error checking schema:", error)
      return { success: false, error: error.message }
    }

    // If we have data, return the keys (column names)
    if (data && data.length > 0) {
      return {
        success: true,
        columns: Object.keys(data[0]),
      }
    }

    // If no data, try to get table information from PostgreSQL information_schema
    const { data: columnData, error: columnError } = await supabase.rpc("get_table_columns", {
      table_name: "generated_code",
    })

    if (!columnError && columnData) {
      return {
        success: true,
        columns: columnData,
      }
    }

    // If that fails too, try a minimal insert with different field combinations
    const testFields = [
      { name: "Schema Test" },
      { title: "Schema Test" },
      { description: "Schema Test" },
      { content: "Schema Test" },
      { data: "Schema Test" },
      { code: "Schema Test" },
    ]

    for (const fields of testFields) {
      try {
        const { error: insertError } = await supabase.from("generated_code").insert(fields).select()

        if (!insertError) {
          return {
            success: true,
            message: `Insert succeeded with fields: ${Object.keys(fields).join(", ")}`,
            usableFields: Object.keys(fields),
          }
        }
      } catch (e) {
        // Continue to the next field combination
      }
    }

    return {
      success: false,
      error: "Could not determine table schema",
      message: "Try running a direct SQL query to inspect the table structure",
    }
  } catch (error) {
    console.error("Error in checkGeneratedCodeSchema:", error)
    return { success: false, error: error.message }
  }
}
