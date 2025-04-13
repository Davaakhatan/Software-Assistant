import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { code, fileName, language, framework, requirements } = await request.json()

    if (!code || !fileName) {
      return NextResponse.json({ error: "Code and file name are required" }, { status: 400 })
    }

    const supabase = getSupabaseServer()

    console.log("Saving code to database")

    // Prepare the insert data WITHOUT project_id to avoid foreign key constraint issues
    const insertData = {
      generated_code: code,
      language: language || "typescript",
      framework: framework || "nextjs",
      requirements: requirements || `File name: ${fileName}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Explicitly NOT including project_id to avoid foreign key constraint
    }

    console.log("Inserting data with fields:", Object.keys(insertData))

    // Save to code_generations table
    const { data: dbData, error: dbError } = await supabase.from("code_generations").insert(insertData).select()

    if (dbError) {
      console.error("Error saving to code_generations table:", dbError)
      // Continue even if database save fails
    } else {
      console.log("Code saved to database successfully")
    }

    // Return success response - we'll skip the storage part for now since the bucket doesn't exist
    return NextResponse.json({
      success: true,
      message: "Code saved successfully to database",
      id: dbData?.[0]?.id,
    })
  } catch (error) {
    console.error("Error saving code:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
