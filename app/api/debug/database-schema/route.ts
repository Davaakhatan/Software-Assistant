import { NextResponse } from "next/server"
import { createApiClient } from "@/lib/supabase-api-client"

export async function GET() {
  try {
    const supabase = createApiClient()

    // Get database schema information
    const { data, error } = await supabase
      .from("information_schema.columns")
      .select("table_name, column_name, data_type, is_nullable")
      .eq("table_schema", "public")
      .order("table_name", { ascending: true })

    if (error) {
      console.error("Error fetching schema:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Organize by table
    const tables = {}
    data.forEach((column) => {
      if (!tables[column.table_name]) {
        tables[column.table_name] = []
      }
      tables[column.table_name].push({
        name: column.column_name,
        type: column.data_type,
        nullable: column.is_nullable === "YES",
      })
    })

    return NextResponse.json(tables)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
