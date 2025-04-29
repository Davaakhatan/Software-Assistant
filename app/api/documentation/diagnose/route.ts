import { NextResponse } from "next/server"
import { createApiClient } from "@/lib/supabase-api-client"

export async function GET() {
  try {
    const supabase = createApiClient()

    // Check if the documentation table exists
    const { data: tableData, error: tableError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "documentation")

    if (tableError) {
      console.error("Error checking documentation table:", tableError)
      return NextResponse.json({ error: tableError.message }, { status: 500 })
    }

    const tableExists = tableData.length > 0

    if (!tableExists) {
      return NextResponse.json({
        exists: false,
        message: "Documentation table does not exist",
        diagnosis: "Table needs to be created",
      })
    }

    // Check columns
    const { data: columnData, error: columnError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type")
      .eq("table_schema", "public")
      .eq("table_name", "documentation")

    if (columnError) {
      console.error("Error checking documentation columns:", columnError)
      return NextResponse.json({ error: columnError.message }, { status: 500 })
    }

    const columns = columnData.reduce((acc, col) => {
      acc[col.column_name] = col.data_type
      return acc
    }, {})

    return NextResponse.json({
      exists: true,
      columns,
      diagnosis: "Table exists with the following columns",
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
