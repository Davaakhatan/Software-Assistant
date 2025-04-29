import { NextResponse } from "next/server"
import { createApiClient } from "@/lib/supabase-api-client"

export async function POST(request: Request) {
  try {
    const supabase = createApiClient()
    const body = await request.json()

    const { title, content, project_id, type } = body

    if (!title || !content) {
      return NextResponse.json({ error: "Missing required fields: title and content are required" }, { status: 400 })
    }

    // Insert the documentation
    const { data, error } = await supabase
      .from("documentation")
      .insert({
        title,
        content,
        project_id: project_id || null,
        type: type || "general",
        created_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Error saving documentation:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Documentation saved successfully",
      data,
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
