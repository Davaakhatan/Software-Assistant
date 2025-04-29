import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = getSupabaseServer()

    // Define possible table names for CI/CD pipelines
    const possibleTables = ["ci_cd_pipelines", "cicd_pipelines", "pipelines", "ci_pipelines"]
    const tableResults = {}

    // Fetch table existence and data in a single query
    for (const tableName of possibleTables) {
      const { data, error, count } = await supabase
        .from(tableName)
        .select("*", { count: "exact" })
        .limit(10)
        .catch((err) => {
          console.error(`Error fetching data from table ${tableName}:`, err)
          return {
            data: null,
            error: { message: `Table ${tableName} might not exist or is inaccessible` },
            count: null,
          }
        })

      tableResults[tableName] = {
        exists: !error,
        count: count || 0,
        data: data || [],
        error: error ? error.message : null,
      }
    }

    return NextResponse.json({
      tableResults,
    })
  } catch (error) {
    console.error("Error in debug route:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
