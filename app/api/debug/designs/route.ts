import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const specificationId = searchParams.get("specificationId")

    const supabase = getSupabaseServer()

    // Get debug information about specifications, requirements, and designs
    const debug = {
      timestamp: new Date().toISOString(),
      query: { specificationId },
      tables: {},
      relationships: {},
    }

    // Check specifications
    const { data: specs, error: specsError } = await supabase
      .from("specifications")
      .select("id, app_name")
      .order("created_at", { ascending: false })
      .limit(10)

    debug.tables.specifications = {
      count: specs?.length || 0,
      error: specsError?.message || null,
      sample: specs || [],
    }

    // Check requirements
    const { data: reqs, error: reqsError } = await supabase
      .from("requirements")
      .select("id, project_name, specification_id")
      .order("created_at", { ascending: false })
      .limit(10)

    debug.tables.requirements = {
      count: reqs?.length || 0,
      error: reqsError?.message || null,
      sample: reqs || [],
    }

    // Check designs
    const { data: designs, error: designsError } = await supabase
      .from("designs")
      .select("id, type, project_name, requirement_id")
      .order("created_at", { ascending: false })
      .limit(10)

    debug.tables.designs = {
      count: designs?.length || 0,
      error: designsError?.message || null,
      sample: designs || [],
    }

    // If a specification ID was provided, check relationships
    if (specificationId) {
      // Get requirements for this specification
      const { data: specReqs, error: specReqsError } = await supabase
        .from("requirements")
        .select("id, project_name")
        .eq("specification_id", specificationId)

      debug.relationships.specificationRequirements = {
        specificationId,
        count: specReqs?.length || 0,
        error: specReqsError?.message || null,
        requirements: specReqs || [],
      }

      // If we found requirements, get designs for them
      if (specReqs && specReqs.length > 0) {
        const reqIds = specReqs.map((req) => req.id)

        const { data: reqDesigns, error: reqDesignsError } = await supabase
          .from("designs")
          .select("id, type, project_name, requirement_id")
          .in("requirement_id", reqIds)

        debug.relationships.requirementDesigns = {
          requirementIds: reqIds,
          count: reqDesigns?.length || 0,
          error: reqDesignsError?.message || null,
          designs: reqDesigns || [],
        }
      }
    }

    return NextResponse.json(debug)
  } catch (error) {
    console.error("Error in debug designs API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
