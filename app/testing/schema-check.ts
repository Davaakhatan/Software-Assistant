"use server"

import { getSupabase } from "@/lib/supabase"

export async function checkTestCasesSchema() {
  try {
    const supabase = getSupabase()

    // Query a single row to see the column names
    const { data, error } = await supabase.from("test_cases").select("*").limit(1)

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

    // If no data, try to insert a minimal record to see what columns are required
    const minimalData = {
      name: "Schema Test",
      test_type: "unit",
      specification_id: null,
    }

    const { error: insertError } = await supabase.from("test_cases").insert(minimalData).select()

    if (insertError) {
      // Look for column errors in the message
      return {
        success: false,
        error: insertError.message,
        hint: "Check error message for column requirements",
      }
    }

    return { success: true, message: "Minimal insert succeeded" }
  } catch (error) {
    console.error("Error in checkTestCasesSchema:", error)
    return { success: false, error: error.message }
  }
}
