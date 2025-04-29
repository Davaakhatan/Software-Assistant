import { NextResponse } from "next/server"
import { createApiClient } from "@/lib/supabase-api-client"

export async function GET() {
  try {
    const supabase = createApiClient()

    // Get the database schema
    const { data, error } = await supabase.rpc("get_schema_info")

    if (error) {
      console.error("Error fetching schema:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
