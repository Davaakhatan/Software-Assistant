import { NextResponse } from "next/server"
import { createApiClient } from "@/lib/supabase-api-client"

export async function GET() {
  try {
    // Create a new Supabase client for this request
    const supabase = createApiClient()

    // Check if the documentation table exists
    const { data, error } = await supabase.from("documentation").select("count(*)").limit(1)

    if (error) {
      console.error("Error checking documentation table:", error)
      return NextResponse.json({ exists: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ exists: true, count: data.length })
  } catch (error) {
    console.error("Unexpected error checking documentation table:", error)
    return NextResponse.json(
      { exists: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
