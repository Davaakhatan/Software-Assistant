import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"
import { generateAIText } from "@/lib/ai-service"

export const maxDuration = 60 // Extend the function timeout to 60 seconds

export async function POST(request: NextRequest) {
  try {
    const { activeTab, specificationId, designId, requirements, language, framework } = await request.json()

    console.log("Generate code request received:", { activeTab, specificationId, designId, language, framework })

    let prompt = ""
    let systemPrompt = ""

    // Generate code based on the active tab
    if (activeTab === "fromSpecDesign") {
      const supabase = getSupabaseServer()

      // Fetch specification and design in parallel to save time
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

      // Build prompt based on specification and design
      prompt = `Generate ${language} code using the ${framework} framework based on the following information:

Specification:
App Name: ${specification.app_name || "N/A"}
App Type: ${specification.app_type || "N/A"}
Description: ${specification.app_description || "N/A"}
`

      if (specification.functional_requirements) {
        prompt += `
Functional Requirements:
${specification.functional_requirements}
`
      }

      if (specification.non_functional_requirements) {
        prompt += `
Non-Functional Requirements:
${specification.non_functional_requirements}
`
      }

      prompt += `
Design:
Type: ${design.type || "N/A"}
`

      if (design.diagram_code) {
        prompt += `
Diagram:
${design.diagram_code}
`
      }

      if (design.description) {
        prompt += `
Description:
${design.description}
`
      }

      prompt += `
Please generate complete, well-structured ${language} code using the ${framework} framework that implements these requirements.`

      // Generate code using AI
      systemPrompt = `You are an expert software developer specializing in ${language} and ${framework}. 
Generate high-quality, production-ready code based on the provided specifications and designs. 
Include comments and explanations where appropriate.
Follow best practices for ${language} and ${framework}.`
    } else {
      // Generate from manual requirements
      prompt = `
Generate ${language} code using the ${framework} framework based on the following requirements:

${requirements}

Please provide clean, well-structured code with comments.`

      systemPrompt = `You are an expert software developer specializing in ${language} and ${framework}. 
Generate high-quality, production-ready code based on the requirements provided.
Follow these guidelines:
1. Write clean, well-structured, and commented code
2. Follow best practices for ${language} and ${framework}
3. Implement proper error handling
4. Ensure the code is secure and follows modern development standards
5. Include necessary type definitions if using TypeScript`
    }

    // Generate code using AI
    try {
      console.log("Generating code with AI...")
      const result = await generateAIText(prompt, systemPrompt)

      if (!result.success || !result.text) {
        console.error("AI generation failed:", result.error)
        return NextResponse.json({ error: result.error || "Failed to generate code" }, { status: 500 })
      }

      const code = result.text
      console.log("Code generated successfully")

      // Save the generated code to the code_generations table if possible
      try {
        const supabase = getSupabaseServer()
        await supabase.from("code_generations").insert({
          code: code,
          language: language,
          framework: framework,
          created_at: new Date().toISOString(),
          // Don't include project_id to avoid foreign key constraint issues
        })
      } catch (dbError) {
        console.warn("Could not save generated code to database:", dbError)
        // Continue even if saving to DB fails
      }

      return NextResponse.json({ code })
    } catch (aiError) {
      console.error("Error generating code with AI:", aiError)

      // Provide a fallback response with an error message
      return NextResponse.json({
        code: `// Error generating code: ${aiError instanceof Error ? aiError.message : "Unknown error"}\n\n// Fallback code\nconsole.log("Code generation failed");`,
        error: aiError instanceof Error ? aiError.message : "An unexpected error occurred",
      })
    }
  } catch (error) {
    console.error("Error in generate-code API:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        code: `// Error: ${error instanceof Error ? error.message : "An unexpected error occurred"}\n\n// Fallback code\nconsole.log("Code generation failed");`,
      },
      { status: 500 },
    )
  }
}
