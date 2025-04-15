import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"
import fs from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "app/code-generation/create-exec-sql-function.sql")
    const sqlQuery = fs.readFileSync(sqlFilePath, "utf8")

    // Execute the SQL query directly
    const { data, error } = await supabase.rpc("exec_sql", { query: sqlQuery })

    if (error) {
      console.error("Error creating exec_sql function:", error)

      // If the function doesn't exist yet, we need to create it differently
      if (error.message.includes("function") && error.message.includes("does not exist")) {
        // Create the function using a direct query
        const { error: directError } = await supabase.from("_exec_sql_temp").insert({
          query: sqlQuery,
        })

        if (directError) {
          return NextResponse.json(
            { success: false, error: `Error creating exec_sql function: ${directError.message}` },
            { status: 500 },
          )
        }
      } else {
        return NextResponse.json(
          { success: false, error: `Error creating exec_sql function: ${error.message}` },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creating exec_sql function:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
