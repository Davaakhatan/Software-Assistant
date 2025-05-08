import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    // SQL to create the test_cases table with minimal columns
    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS test_cases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT,
      test_type TEXT,
      framework TEXT,
      component_to_test TEXT,
      generated_tests JSONB,
      specification_id UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    `

    // Try to execute the SQL
    try {
      const { error } = await supabase.sql(createTableSQL)

      if (error) {
        console.error("Error creating table with SQL:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }
    } catch (sqlError) {
      console.error("Exception executing SQL:", sqlError)

      // If SQL execution fails, try a different approach
      try {
        // Check if the table exists
        const { data, error: checkError } = await supabase.from("test_cases").select("id").limit(1)

        if (checkError) {
          // Table doesn't exist, try to create it using insert
          const { error: insertError } = await supabase.from("test_cases").insert([
            {
              name: "Test Table Setup",
              test_type: "setup",
              framework: "none",
              component_to_test: "none",
              generated_tests: JSON.stringify({ setup: true }),
            },
          ])

          if (insertError && !insertError.message.includes("already exists")) {
            console.error("Error creating table with insert:", insertError)
            return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
          }
        }
      } catch (fallbackError) {
        console.error("Fallback approach failed:", fallbackError)
        return NextResponse.json({ success: false, error: fallbackError.message }, { status: 500 })
      }
    }

    // Check if the table was created successfully
    try {
      const { data, error: checkError } = await supabase.from("test_cases").select("id").limit(1)

      if (checkError) {
        console.error("Error checking if table exists:", checkError)
        return NextResponse.json({ success: false, error: checkError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Test cases table set up successfully",
        tableExists: true,
      })
    } catch (checkError) {
      console.error("Error checking table:", checkError)
      return NextResponse.json({ success: false, error: checkError.message }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in setup-database route:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
