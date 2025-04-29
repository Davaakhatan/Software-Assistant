import { NextResponse } from "next/server"
import { createApiClient } from "@/lib/supabase-api-client"

export async function GET() {
  try {
    const supabase = createApiClient()

    // Simple test query
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "documentation")
      .limit(1)

    if (error) {
      console.error("Error testing documentation table:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const exists = data.length > 0

    return NextResponse.json({
      success: true,
      exists,
      message: exists ? "Documentation table exists" : "Documentation table does not exist",
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
