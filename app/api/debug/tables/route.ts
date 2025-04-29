import { NextResponse } from "next/server"
import { createApiClient } from "@/lib/supabase-api-client"

export async function GET() {
  try {
    const supabase = createApiClient()

    // Get all tables in the public schema
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")

    if (error) {
      console.error("Error fetching tables:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
