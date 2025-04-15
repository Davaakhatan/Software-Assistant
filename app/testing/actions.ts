"use server"

import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { generateAIText } from "@/lib/ai-service"

export async function saveTestCases({
  testType,
  framework,
  componentToTest,
  testCases,
  generatedTests,
  specificationId,
  name = "Generated Tests",
}) {
  try {
    // Use the admin client to bypass RLS
    const supabase = getSupabaseAdmin()

    // Create a data object that matches the actual table schema
    const testCaseData = {
      name: name,
      test_type: testType,
      framework: framework,
      component_to_test: componentToTest,
      generated_tests: JSON.stringify({
        cases: testCases,
        generatedCode: generatedTests,
      }),
      specification_id: specificationId,
    }

    // Save the test cases
    const { data, error } = await supabase.from("test_cases").insert([testCaseData]).select()

    if (error) {
      console.error("Error saving test cases:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error in saveTestCases:", error)
    return { success: false, error: error.message }
  }
}

export async function getTestCases() {
  try {
    // Use the admin client to bypass RLS
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase.from("test_cases").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching test cases:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in getTestCases:", error)
    return { success: false, error: error.message }
  }
}

export async function getTestCasesById(id) {
  try {
    // Use the admin client to bypass RLS
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase.from("test_cases").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching test cases by ID:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in getTestCasesById:", error)
    return { success: false, error: error.message }
  }
}

export async function generateAITestCases({
  testType,
  framework,
  componentToTest,
  componentDescription,
  specificationData,
  designData,
}) {
  try {
    // Create a prompt for the AI to generate test cases
    const prompt = `
Generate comprehensive ${testType} tests for a React component named "${componentToTest}" using the ${framework} testing framework.

${componentDescription ? `Component description: ${componentDescription}` : ""}

${specificationData ? `Application specification: ${JSON.stringify(specificationData, null, 2)}` : ""}

${designData ? `Design information: ${JSON.stringify(designData, null, 2)}` : ""}

Please generate:
1. A list of test cases with descriptions and expected outcomes
2. The complete test code implementation using ${framework} and React Testing Library

Format the response as a JSON object with the following structure:
{
  "testCases": [
    {
      "description": "should render correctly",
      "expectation": "component renders without errors"
    },
    // more test cases...
  ],
  "testCode": "// Complete test code implementation here..."
}
`

    const systemPrompt = `
You are an expert test engineer specializing in React testing. Your task is to generate comprehensive test cases and implementation code for React components.
Follow best practices for ${framework} and React Testing Library.
Include tests for rendering, user interactions, error states, and edge cases.
Make sure the generated code is valid JavaScript/TypeScript that would work in a real project.
`

    // Generate test cases using AI
    const result = await generateAIText(prompt, systemPrompt, {
      temperature: 0.7,
      maxTokens: 2500,
      timeoutMs: 30000,
    })

    if (!result.success) {
      throw new Error(result.error || "Failed to generate tests with AI")
    }

    // Parse the AI response
    try {
      // The AI might not always return valid JSON, so we need to handle that
      const responseText = result.text || ""

      // Try to extract JSON from the response if it's not already JSON
      let jsonStr = responseText
      if (responseText.includes("```json")) {
        jsonStr = responseText.split("```json")[1].split("```")[0].trim()
      } else if (responseText.includes("```")) {
        jsonStr = responseText.split("```")[1].split("```")[0].trim()
      }

      const parsedResponse = JSON.parse(jsonStr)

      return {
        success: true,
        testCases: parsedResponse.testCases || [],
        testCode: parsedResponse.testCode || "",
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError)

      // If we can't parse the response as JSON, return the raw text
      return {
        success: true,
        testCases: [{ description: "AI generated test", expectation: "Tests generated successfully" }],
        testCode: result.text || "",
      }
    }
  } catch (error) {
    console.error("Error generating AI test cases:", error)
    return {
      success: false,
      error: error.message || "Failed to generate test cases",
    }
  }
}
