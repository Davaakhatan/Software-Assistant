import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  try {
    console.log("Debug API: Fetching all designs...")
    const supabase = getSupabaseServer()

    // Use a simple query to get all designs
    const { data, error } = await supabase.from("designs").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Debug API: Error fetching designs:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Debug API: Successfully fetched ${data?.length || 0} designs`)

    return NextResponse.json({
      count: data?.length || 0,
      designs: data || [],
    })
  } catch (error) {
    console.error("Debug API: Error in designs debug API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
