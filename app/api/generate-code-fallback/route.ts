import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"
import { generateAIText } from "@/lib/ai-service"

// Set a longer timeout for this function
export const maxDuration = 300 // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const { activeTab, specificationId, designId, requirements, language, framework } = await request.json()

    console.log("Generate code fallback request received:", {
      activeTab,
      specificationId,
      designId,
      language,
      framework,
    })

    let prompt = ""
    let systemPrompt = ""

    // Generate code based on the active tab
    if (activeTab === "fromSpecDesign") {
      const supabase = getSupabaseServer()

      // Fetch specification and design in parallel
      const [specResult, designResult] = await Promise.all([
        supabase.from("specifications").select("*").eq("id", specificationId).single(),
        supabase.from("designs").select("*").eq("id", designId).single(),
      ])

      if (specResult.error) {
        console.error("Error fetching specification:", specResult.error)
        return NextResponse.json({ error: "Failed to fetch specification" }, { status: 400 })
      }

      if (designResult.error) {
        console.error("Error fetching design:", designResult.error)
        return NextResponse.json({ error: "Failed to fetch design" }, { status: 400 })
      }

      const specification = specResult.data
      const design = designResult.data

      // Build prompt based on specification and design (simplified for performance)
      prompt = `Generate ${language} code using ${framework} framework.
App: ${specification.app_name || "N/A"}, Type: ${specification.app_type || "N/A"}
Description: ${specification.app_description || "N/A"}
Requirements: ${specification.functional_requirements || ""}
Design: ${design.type || "N/A"}, ${design.description || ""}
`

      // Generate code using AI
      systemPrompt = `You are an expert ${language}/${framework} developer. Generate production-ready code.`
    } else {
      // Generate from manual requirements (simplified)
      prompt = `Generate ${language} code using ${framework} framework.
Requirements: ${requirements}
`
      systemPrompt = `You are an expert ${language}/${framework} developer. Generate production-ready code.`
    }

    // Generate code using AI with longer timeout
    try {
      console.log("Generating code with AI (fallback)...")
      const result = await generateAIText(prompt, systemPrompt, { temperature: 0.5 })

      if (!result.success || !result.text) {
        console.error("AI generation failed:", result.error)
        return NextResponse.json({ error: result.error || "Failed to generate code" }, { status: 500 })
      }

      const code = result.text
      console.log("Code generated successfully (fallback)")

      // Save the generated code to the database
      try {
        const supabase = getSupabaseServer()
        await supabase.from("code_generations").insert({
          code: code,
          language: language,
          framework: framework,
          created_at: new Date().toISOString(),
        })
      } catch (dbError) {
        console.warn("Could not save generated code to database:", dbError)
      }

      return NextResponse.json({ code })
    } catch (aiError) {
      console.error("Error generating code with AI (fallback):", aiError)
      return NextResponse.json({
        code: `// Error generating code: ${aiError instanceof Error ? aiError.message : "Unknown error"}`,
        error: aiError instanceof Error ? aiError.message : "An unexpected error occurred",
      })
    }
  } catch (error) {
    console.error("Error in generate-code-fallback API:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        code: `// Error: ${error instanceof Error ? error.message : "An unexpected error occurred"}`,
      },
      { status: 500 },
    )
  }
}
