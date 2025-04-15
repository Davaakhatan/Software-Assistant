import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"
import fs from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "app/code-generation/setup-code-generations-table.sql")
    const sqlQuery = fs.readFileSync(sqlFilePath, "utf8")

    // Execute the SQL query
    const { error } = await supabase.rpc("exec_sql", { query: sqlQuery })

    if (error) {
      console.error("Error executing SQL:", error)
      return NextResponse.json({ success: false, error: `Error executing SQL: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error setting up code_generations table:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
