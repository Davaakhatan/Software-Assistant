import { supabaseServer } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET(request, { params }) {
  try {
    const id = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid specification ID format",
        },
        { status: 400 },
      )
    }

    const { data, error } = await supabaseServer.from("specifications").select("*").eq("id", id).single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Error fetching specification by id:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
