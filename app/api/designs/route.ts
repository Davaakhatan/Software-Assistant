import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = getSupabaseServer()

    const { data, error } = await supabase.from("designs").select("*").order("created_at", { ascending: false })

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
