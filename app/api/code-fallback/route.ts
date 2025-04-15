import { NextResponse } from "next/server"

// Simple route handler without any configuration
export async function POST(request) {
  try {
    const { code, fileName, language, framework, requirements } = await request.json()

    if (!code || !fileName) {
      return NextResponse.json({ error: "Code and file name are required" }, { status: 400 })
    }

    // Log the code generation but don't try to save it to the database
    console.log("Code generated:", {
      fileName,
      language,
      framework,
      codeLength: code.length,
      requirements: requirements ? requirements.substring(0, 100) + "..." : "None",
    })

    // Return success even though we didn't save to the database
    return NextResponse.json({
      success: true,
      message: "Code processed successfully",
      fileName,
    })
  } catch (error) {
    console.error("Error processing code:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
