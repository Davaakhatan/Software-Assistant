import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const specificationId = searchParams.get("specificationId")
    const projectName = searchParams.get("projectName")

    console.log("Designs API called with params:", { specificationId, projectName })

    const supabase = getSupabaseServer()

    // If we have a specification ID, first get all requirements for this specification
    if (specificationId) {
      console.log("Fetching designs for specification:", specificationId)

      // Get all requirements for this specification
      const { data: requirements, error: reqError } = await supabase
        .from("requirements")
        .select("id")
        .eq("specification_id", specificationId)

      if (reqError) {
        console.error("Error fetching requirements:", reqError)
        return NextResponse.json({ error: "Failed to fetch requirements" }, { status: 500 })
      }

      if (requirements && requirements.length > 0) {
        // Get all designs for these requirements
        const reqIds = requirements.map((req) => req.id)
        console.log("Found requirement IDs:", reqIds)

        const { data: designs, error: designsError } = await supabase
          .from("designs")
          .select("*")
          .in("requirement_id", reqIds)
          .order("created_at", { ascending: false })

        if (designsError) {
          console.error("Error fetching designs:", designsError)
          return NextResponse.json({ error: "Failed to fetch designs" }, { status: 500 })
        }

        console.log(`Found ${designs?.length || 0} designs for specification`)
        return NextResponse.json(designs || [])
      } else {
        console.log("No requirements found for specification")

        // If no requirements found but we have a project name, try to match by project name
        if (projectName) {
          const { data: nameDesigns, error: nameError } = await supabase
            .from("designs")
            .select("*")
            .ilike("project_name", `%${projectName}%`)
            .order("created_at", { ascending: false })

          if (nameError) {
            console.error("Error fetching designs by project name:", nameError)
          } else {
            console.log(`Found ${nameDesigns?.length || 0} designs by project name`)
            return NextResponse.json(nameDesigns || [])
          }
        }

        return NextResponse.json([])
      }
    }

    // If no specification ID, just get all designs
    const { data, error } = await supabase.from("designs").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching all designs:", error)
      return NextResponse.json({ error: "Failed to fetch designs" }, { status: 500 })
    }

    console.log(`Found ${data?.length || 0} total designs`)
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error in designs API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
