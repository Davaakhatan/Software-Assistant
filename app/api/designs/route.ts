import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const specificationId = searchParams.get("specificationId")
    const projectName = searchParams.get("projectName")

    const supabase = getSupabaseServer()

    // Start with a base query
    let query = supabase
      .from("designs")
      .select("*, requirements(*, specification_id)")
      .order("created_at", { ascending: false })

    // Filter by specification ID if provided
    if (specificationId) {
      // First try to get designs directly linked to this specification via requirements
      const { data: reqDesigns, error: reqError } = await supabase
        .from("requirements")
        .select("id")
        .eq("specification_id", specificationId)

      if (!reqError && reqDesigns && reqDesigns.length > 0) {
        const reqIds = reqDesigns.map((req) => req.id)
        query = query.in("requirement_id", reqIds)
      } else if (projectName) {
        // If no requirements found but we have a project name, try to match by project name
        query = query.ilike("project_name", `%${projectName}%`)
      }
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
