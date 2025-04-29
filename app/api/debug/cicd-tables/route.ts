import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = getSupabaseServer()

    // Get list of tables
    const { data: tables, error: tablesError } = await supabase
      .from("pg_catalog.pg_tables")
      .select("tablename")
      .eq("schemaname", "public")

    if (tablesError) {
      return NextResponse.json(
        {
          error: "Error fetching tables",
          details: tablesError,
        },
        { status: 500 },
      )
    }

    // Try different possible table names for CI/CD pipelines
    const possibleTables = ["ci_cd_pipelines", "cicd_pipelines", "pipelines", "ci_pipelines"]
    const tableResults = {}

    for (const tableName of possibleTables) {
      const { data, error, count } = await supabase
        .from(tableName)
        .select("*", { count: "exact" })
        .limit(10)
        .catch(() => ({ data: null, error: { message: `Table ${tableName} might not exist` }, count: null }))

      tableResults[tableName] = {
        exists: !error,
        count,
        data: data || [],
        error: error ? error.message : null,
      }
    }

    // Get raw SQL result for ci_cd_pipelines
    const { data: rawData, error: rawError } = await supabase
      .rpc("get_cicd_pipelines")
      .catch(() => ({ data: null, error: { message: "RPC function get_cicd_pipelines doesn't exist" } }))

    return NextResponse.json({
      tables: tables?.map((t) => t.tablename) || [],
      tableResults,
      rawSqlResult: {
        data: rawData || [],
        error: rawError ? rawError.message : null,
      },
    })
  } catch (error) {
    console.error("Error in debug route:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}
