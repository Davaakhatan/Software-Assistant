import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function POST(request) {
  try {
    const { code, fileName, language, framework, requirements } = await request.json()

    if (!code && !fileName) {
      return NextResponse.json({ error: "Code or file name is required" }, { status: 400 })
    }

    // Log the code generation
    console.log("Code generated:", {
      fileName: fileName || "unnamed",
      language: language || "unknown",
      framework: framework || "unknown",
      codeLength: code ? code.length : 0,
      requirements: requirements ? requirements.substring(0, 100) + "..." : "None",
    })

    // Try to save to the database, but don't fail if it doesn't work
    try {
      const supabase = getSupabaseServer()

      // Only attempt to save if we have both code and fileName
      if (code && fileName) {
        const insertData = {
          generated_code: code,
          language: language || "unknown",
          framework: framework || "unknown",
          requirements: requirements || `File name: ${fileName}`,
          created_at: new Date().toISOString(),
        }

        await supabase.from("code_generations").insert([insertData])
        console.log("Successfully saved code to database")
      }
    } catch (dbError) {
      // Just log the error but don't fail the request
      console.error("Database error (non-critical):", dbError)
    }

    // Return success even if database save failed
    return NextResponse.json({
      success: true,
      message: "Code processed successfully",
      fileName: fileName || "unnamed",
    })
  } catch (error) {
    console.error("Error processing code:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred", success: false },
      { status: 500 },
    )
  }
}
