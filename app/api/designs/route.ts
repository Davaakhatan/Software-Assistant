import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const specificationId = searchParams.get("specificationId")

    const supabase = getSupabaseServer()

    let query = supabase.from("designs").select("*").order("created_at", { ascending: false })

    // Filter by specification ID if provided
    if (specificationId) {
      query = query.eq("requirement_id", specificationId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching designs:", error)
      return NextResponse.json({ error: "Failed to fetch designs" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error in designs API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
