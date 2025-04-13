import { supabaseServer } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Get information about the designs table
    const { data: designsInfo, error: designsError } = await supabaseServer
      .from("information_schema.columns")
      .select("*")
      .eq("table_name", "designs")

    if (designsError) {
      return NextResponse.json(
        {
          success: false,
          error: designsError.message,
          message: "Failed to get designs table info",
        },
        { status: 500 },
      )
    }

    // Get foreign key information
    const { data: foreignKeys, error: foreignKeysError } = await supabaseServer
      .from("information_schema.key_column_usage")
      .select(`
        constraint_name,
        table_name,
        column_name,
        referenced_table_name,
        referenced_column_name
      `)
      .eq("table_name", "designs")

    if (foreignKeysError) {
      return NextResponse.json(
        {
          success: false,
          error: foreignKeysError.message,
          message: "Failed to get foreign key info",
        },
        { status: 500 },
      )
    }

    // Get a sample from the projects table if it exists
    let projectsInfo = null
    try {
      const { data, error } = await supabaseServer.from("projects").select("*").limit(1)

      if (!error) {
        projectsInfo = data
      }
    } catch (e) {
      console.error("Error checking projects table:", e)
    }

    return NextResponse.json({
      success: true,
      designsInfo,
      foreignKeys,
      projectsInfo,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
