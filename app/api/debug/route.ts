import { supabaseServer } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Get information about the designs table
    const { data: designsInfo, error: designsError } = await supabaseServer.rpc("get_table_info", {
      table_name: "designs",
    })

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

    // Get information about the requirements table
    const { data: requirementsInfo, error: requirementsError } = await supabaseServer.rpc("get_table_info", {
      table_name: "requirements",
    })

    if (requirementsError) {
      return NextResponse.json(
        {
          success: false,
          error: requirementsError.message,
          message: "Failed to get requirements table info",
        },
        { status: 500 },
      )
    }

    // Get foreign key information
    const { data: foreignKeys, error: foreignKeysError } = await supabaseServer
      .from("information_schema.table_constraints")
      .select(`
        constraint_name,
        table_name,
        constraint_type
      `)
      .eq("constraint_type", "FOREIGN KEY")
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

    // Get foreign key column information
    const { data: foreignKeyColumns, error: foreignKeyColumnsError } = await supabaseServer
      .from("information_schema.key_column_usage")
      .select(`
        constraint_name,
        table_name,
        column_name,
        referenced_table_name,
        referenced_column_name
      `)
      .eq("table_name", "designs")

    if (foreignKeyColumnsError) {
      return NextResponse.json(
        {
          success: false,
          error: foreignKeyColumnsError.message,
          message: "Failed to get foreign key column info",
        },
        { status: 500 },
      )
    }

    // Get a sample requirement
    const { data: sampleRequirement, error: sampleRequirementError } = await supabaseServer
      .from("requirements")
      .select("*")
      .limit(1)
      .single()

    if (sampleRequirementError && sampleRequirementError.code !== "PGRST116") {
      return NextResponse.json(
        {
          success: false,
          error: sampleRequirementError.message,
          message: "Failed to get sample requirement",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      designsInfo,
      requirementsInfo,
      foreignKeys,
      foreignKeyColumns,
      sampleRequirement,
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
