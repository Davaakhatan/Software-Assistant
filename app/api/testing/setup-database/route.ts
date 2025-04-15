import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = getSupabaseAdmin()

    // Check if the test_cases table exists
    const { data: tables, error: tablesError } = await supabase
      .from("pg_tables")
      .select("tablename")
      .eq("schemaname", "public")
      .eq("tablename", "test_cases")

    if (tablesError) {
      console.error("Error checking if table exists:", tablesError)
      return NextResponse.json(
        { success: false, message: `Error checking if table exists: ${tablesError.message}` },
        { status: 500 },
      )
    }

    let message = ""

    // If the table doesn't exist, create it
    if (!tables || tables.length === 0) {
      const createTableQuery = `
        CREATE TABLE test_cases (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID,
          test_type TEXT NOT NULL,
          framework TEXT NOT NULL,
          component_to_test TEXT NOT NULL,
          generated_tests TEXT,
          component TEXT,
          name TEXT,
          specification_id UUID,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );
        
        -- Disable RLS for this table
        ALTER TABLE test_cases DISABLE ROW LEVEL SECURITY;
      `

      const { error: createError } = await supabase.rpc("exec", { query: createTableQuery })

      if (createError) {
        console.error("Error creating test_cases table:", createError)
        return NextResponse.json(
          { success: false, message: `Error creating test_cases table: ${createError.message}` },
          { status: 500 },
        )
      }

      message = "Created test_cases table successfully with RLS disabled."
    } else {
      // If the table exists, make sure RLS is disabled
      const disableRlsQuery = `
        ALTER TABLE test_cases DISABLE ROW LEVEL SECURITY;
      `

      const { error: rlsError } = await supabase.rpc("exec", { query: disableRlsQuery })

      if (rlsError) {
        console.error("Error disabling RLS:", rlsError)
        return NextResponse.json(
          { success: false, message: `Error disabling RLS: ${rlsError.message}` },
          { status: 500 },
        )
      }

      message = "The test_cases table already exists. RLS has been disabled."
    }

    // Get the current schema of the test_cases table
    const { data: columns, error: columnsError } = await supabase.rpc("exec", {
      query: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'test_cases'
        ORDER BY ordinal_position;
      `,
    })

    if (columnsError) {
      console.error("Error getting table schema:", columnsError)
      return NextResponse.json(
        { success: false, message: `Error getting table schema: ${columnsError.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message,
      columns: columns,
    })
  } catch (error) {
    console.error("Error in setup-database route:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}
