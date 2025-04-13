import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = getSupabaseServer()

    const { data, error } = await supabase.from("specifications").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching specifications:", error)
      return NextResponse.json({ error: "Failed to fetch specifications" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error in specifications API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
