import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const supabase = getSupabaseServer()

    // Add more detailed logging for debugging in production
    console.log("Fetching specifications from Supabase")

    const { data, error } = await supabase.from("specifications").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching specifications:", error)
      return NextResponse.json({ error: "Failed to fetch specifications" }, { status: 500 })
    }

    console.log(`Successfully fetched ${data?.length || 0} specifications`)

    // Set cache control headers to prevent caching
    return new NextResponse(JSON.stringify(data || []), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    })
  } catch (error) {
    console.error("Error in specifications API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
