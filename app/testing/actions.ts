"use server"

import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { revalidatePath } from "next/cache"
import { getSupabase } from "@/lib/supabase"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Existing functions...

export async function analyzeUploadedCode({ fileUrl, fileName }) {
  try {
    console.log(`Analyzing uploaded code from ${fileUrl}`)

    // Get the file content
    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }

    const codeContent = await response.text()

    // Extract component name from filename
    const baseFileName = fileName.split(".")[0]
    let componentName = baseFileName
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("")

    // If the file is too large, truncate it for analysis
    const truncatedContent =
      codeContent.length > 10000 ? codeContent.substring(0, 10000) + "...[truncated]" : codeContent

    // Use AI to analyze the code if OPENAI_API_KEY is available
    let description = `Component from file ${fileName}`
    let suggestedTestCases = []

    try {
      const prompt = `
        Analyze this code and provide:
        1. A brief description of what this component/module does
        2. 3-5 test cases that would be appropriate for testing it
        3. The main component or function name that should be tested

        Code:
        \`\`\`
        ${truncatedContent}
        \`\`\`

        Respond in JSON format with the following structure:
        {
          "componentName": "string",
          "description": "string",
          "testCases": [
            { "description": "string", "expectation": "string" }
          ]
        }
      `

      const { text } = await generateText({
        model: openai("gpt-3.5-turbo"),
        prompt,
        temperature: 0.3,
        maxTokens: 1000,
      })

      try {
        const analysis = JSON.parse(text)

        if (analysis.componentName) {
          componentName = analysis.componentName
        }

        if (analysis.description) {
          description = analysis.description
        }

        if (Array.isArray(analysis.testCases)) {
          suggestedTestCases = analysis.testCases
        }
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError)
        // Continue with default values
      }
    } catch (aiError) {
      console.error("Error using AI to analyze code:", aiError)
      // Continue with default values
    }

    return {
      success: true,
      componentName,
      description,
      codeContent,
      suggestedTestCases:
        suggestedTestCases.length > 0
          ? suggestedTestCases
          : [
              { description: "should render correctly", expectation: "component renders without errors" },
              { description: 'should handle props correctly", expectation": "component uses props as expected' },
            ],
    }
  } catch (error) {
    console.error("Error analyzing uploaded code:", error)
    return {
      success: false,
      error: error.message || "Failed to analyze the uploaded code",
    }
  }
}

// Add this to your existing saveTestCases function
export async function saveTestCases(params: {
  testType: string
  framework: string
  componentToTest: string
  testCases: Array<{ description: string; expectation: string }>
  generatedTests: string
  specificationId: string
  designId: string | null
  generatedCodeId: string | null
  name: string
  uploadedFileUrl?: string | null
  uploadedFileName?: string | null
}) {
  try {
    const supabase = getSupabase()

    // Insert the test case into the database
    const { data, error } = await supabase
      .from("test_cases")
      .insert({
        name: params.name,
        test_type: params.testType,
        framework: params.framework,
        component_name: params.componentToTest,
        test_cases: params.testCases,
        generated_tests: params.generatedTests,
        specification_id: params.specificationId,
        design_id: params.designId,
        generated_code_id: params.generatedCodeId,
        uploaded_file_url: params.uploadedFileUrl || null,
        uploaded_file_name: params.uploadedFileName || null,
      })
      .select()

    if (error) {
      console.error("Error saving test cases:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data: data[0],
    }
  } catch (error) {
    console.error("Error in saveTestCases:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save test cases",
    }
  }
}

// Add this to your existing generateAITestCases function
export async function generateAITestCases(params: {
  testType: string
  framework: string
  componentToTest: string
  componentDescription: string
  specificationData: any
  designData: any
  generatedCodeData: any
  uploadedFileUrl?: string
  uploadedFileName?: string
  uploadedCodeContent?: string
}) {
  try {
    // Prepare the prompt based on the available information
    let prompt = `Generate ${params.testType} tests for a ${params.framework} project for the component "${params.componentToTest}".`

    if (params.componentDescription) {
      prompt += `\n\nComponent description: ${params.componentDescription}`
    }

    if (params.uploadedCodeContent) {
      prompt += `\n\nHere is the actual code of the component:\n\`\`\`\n${params.uploadedCodeContent}\n\`\`\``
    }

    if (params.specificationData) {
      prompt += `\n\nApplication specification: ${JSON.stringify(params.specificationData, null, 2)}`
    }

    if (params.designData) {
      prompt += `\n\nDesign information: ${JSON.stringify(params.designData, null, 2)}`
    }

    prompt += `\n\nPlease generate:
    1. A list of test cases in JSON format with "description" and "expectation" fields
    2. The complete test code using ${params.framework}
    
    Format your response as a JSON object with fields: testCases and testCode.`

    // Use OpenAI to generate tests
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.2,
      maxTokens: 2500,
    })

    // Parse the AI response
    let aiResponse
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch =
        text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*?}/)

      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[1] || jsonMatch[0])
      } else {
        // If no JSON format is found, try to extract structured data from the text
        const testCodeMatch = text.match(/```(?:javascript|typescript|jsx|tsx)?\n([\s\S]*?)\n```/)

        aiResponse = {
          testCases: [
            { description: "should render correctly", expectation: "component renders without errors" },
            { description: "should handle user interactions", expectation: "component responds to user actions" },
          ],
          testCode: testCodeMatch ? testCodeMatch[1] : text,
        }
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError)

      // Create a fallback response
      const testCode = `// Generated ${params.testType} tests for ${params.componentToTest} using ${params.framework}

import { render, screen } from '@testing-library/react';
import ${params.componentToTest} from './${params.componentToTest}';

describe('${params.componentToTest}', () => {
  test('should render correctly', () => {
    render(<${params.componentToTest} />);
    // Add your assertions here
  });
  
  test('should handle user interactions', () => {
    render(<${params.componentToTest} />);
    // Add your interaction tests here
  });
});`

      aiResponse = {
        testCases: [
          { description: "should render correctly", expectation: "component renders without errors" },
          { description: "should handle user interactions", expectation: "component responds to user actions" },
        ],
        testCode,
      }
    }

    return {
      success: true,
      testCases: aiResponse.testCases,
      testCode: aiResponse.testCode,
    }
  } catch (error) {
    console.error("Error generating AI test cases:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate AI test cases",
    }
  }
}

// Add any other existing functions here...
// The rest of the file remains the same...
export async function getGeneratedCodeById(id) {
  try {
    console.log(`Getting generated code with ID: ${id}`)

    // Use the admin client to bypass RLS
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase.from("code_generations").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching generated code by ID:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in getGeneratedCodeById:", error)
    return { success: false, error: error.message }
  }
}

// Helper function to ensure the test_cases table exists with all required columns
// Fixed to avoid using supabase.sql which is not available
async function ensureTestCasesTable(supabase) {
  try {
    // Check if the table exists
    const { data: tableExists, error: tableError } = await supabase.from("test_cases").select("id").limit(1)

    // If the table doesn't exist or there was an error, create it
    if (tableError || !tableExists || tableExists.length === 0) {
      console.log("Creating test_cases table...")

      try {
        // Try to use RPC to create the table
        const { error: createError } = await supabase.rpc("create_test_cases_table")

        if (createError) {
          console.error("RPC error:", createError)

          // If RPC fails, try using a stored procedure if available
          try {
            const { error: procError } = await supabase.rpc("setup_test_cases_table")

            if (procError) {
              console.error("Stored procedure error:", procError)
              console.log("Continuing without creating table...")
            }
          } catch (procCallError) {
            console.error("Stored procedure call failed:", procCallError)
            console.log("Continuing without creating table...")
          }
        }
      } catch (rpcError) {
        console.error("RPC call failed:", rpcError)
        console.log("Continuing without creating table...")
      }
    }

    // Check if the specification_id column exists
    // Instead of using SQL, we'll try to insert a test record with specification_id
    // and see if it works
    try {
      // We'll check if the column exists by trying to use it in a query
      const hasSpecificationIdColumn = await checkIfColumnExists(supabase, "test_cases", "specification_id")

      if (!hasSpecificationIdColumn) {
        console.log("specification_id column might not exist, will store in JSON")
      }
    } catch (error) {
      console.error("Error checking specification_id column:", error)
    }

    return true
  } catch (error) {
    console.error("Error in ensureTestCasesTable:", error)
    return false
  }
}

// Helper function to check if a column exists in a table
async function checkIfColumnExists(supabase, tableName, columnName) {
  try {
    // Try to use the column in a query
    const { data, error } = await supabase.from(tableName).select(columnName).limit(1).maybeSingle()

    // If there's an error about the column not existing, return false
    if (error && error.message.includes(`column "${columnName}" does not exist`)) {
      return false
    }

    // If there's no error, the column exists
    return true
  } catch (error) {
    console.error(`Error checking if column ${columnName} exists in ${tableName}:`, error)
    return false
  }
}

export async function getTestCases() {
  try {
    console.log("Getting test cases from Supabase...")

    // Use the admin client to bypass RLS
    const supabase = getSupabaseAdmin()

    // First, check if the test_cases table exists by querying it directly
    const { data: tableCheck, error: tableError } = await supabase.from("test_cases").select("id").limit(1)

    if (tableError) {
      if (tableError.message.includes("relation") && tableError.message.includes("does not exist")) {
        console.error("test_cases table does not exist:", tableError.message)
        return { success: false, error: "The test_cases table does not exist in the database" }
      }
      console.error("Error checking test_cases table:", tableError)
      return { success: false, error: `Table check error: ${tableError.message}` }
    }

    // If we got here, the table exists, so fetch all the data
    // Use a simpler query without joins first to avoid relationship issues
    const { data: allData, error: fetchError } = await supabase
      .from("test_cases")
      .select("*")
      .order("created_at", { ascending: false })

    if (fetchError) {
      console.error("Error fetching all test cases:", fetchError)
      return { success: false, error: `Fetch error: ${fetchError.message}` }
    }

    // Process the data to extract related IDs from the generated_tests JSON if needed
    const processedData = allData.map((testCase) => {
      let generatedTests = {}
      try {
        if (typeof testCase.generated_tests === "string") {
          generatedTests = JSON.parse(testCase.generated_tests)
        } else if (testCase.generated_tests && typeof testCase.generated_tests === "object") {
          generatedTests = testCase.generated_tests
        }
      } catch (e) {
        console.error("Error parsing generated_tests:", e)
      }

      // Extract related IDs from JSON if they're not in the table columns
      return {
        ...testCase,
        specification_id: testCase.specification_id || generatedTests.specification_id,
        design_id: testCase.design_id || generatedTests.design_id,
        generated_code_id: testCase.generated_code_id || generatedTests.generated_code_id,
        uploaded_file_url: generatedTests.uploaded_file_url || null,
        uploaded_file_name: generatedTests.uploaded_file_name || null,
      }
    })

    // Now, manually fetch the related data for each test case
    const enhancedData = await Promise.all(
      processedData.map(async (testCase) => {
        // Get specification data if available
        let specificationData = null
        if (testCase.specification_id) {
          try {
            const { data: specData, error: specError } = await supabase
              .from("specifications")
              .select("app_name")
              .eq("id", testCase.specification_id)
              .single()

            if (!specError && specData) {
              specificationData = specData
            }
          } catch (error) {
            console.error("Error fetching specification:", error)
          }
        }

        // Get design data if available
        let designData = null
        if (testCase.design_id) {
          try {
            const { data: desData, error: desError } = await supabase
              .from("designs")
              .select("type")
              .eq("id", testCase.design_id)
              .single()

            if (!desError && desData) {
              designData = desData
            }
          } catch (error) {
            console.error("Error fetching design:", error)
          }
        }

        // Get code generation data if available
        let codeData = null
        if (testCase.generated_code_id) {
          try {
            const { data: genData, error: genError } = await supabase
              .from("code_generations")
              .select("language, framework")
              .eq("id", testCase.generated_code_id)
              .single()

            if (!genError && genData) {
              codeData = genData
            }
          } catch (error) {
            console.error("Error fetching code generation:", error)
          }
        }

        return {
          ...testCase,
          specifications: specificationData,
          designs: designData,
          code_generations: codeData,
        }
      }),
    )

    console.log(`Successfully fetched ${enhancedData?.length || 0} test cases`)
    return { success: true, data: enhancedData }
  } catch (error) {
    console.error("Error in getTestCases:", error)
    return { success: false, error: `Unexpected error: ${error.message}` }
  }
}

export async function getTestCasesById(id) {
  try {
    console.log(`Getting test case with ID: ${id}`)

    // Use the admin client to bypass RLS
    const supabase = getSupabaseAdmin()

    // Get the test case data
    const { data: testCase, error } = await supabase.from("test_cases").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching test case by ID:", error)
      return { success: false, error: error.message }
    }

    // Extract related IDs from JSON if they're not in the table columns
    let generatedTests = {}
    try {
      if (typeof testCase.generated_tests === "string") {
        generatedTests = JSON.parse(testCase.generated_tests)
      } else if (testCase.generated_tests && typeof testCase.generated_tests === "object") {
        generatedTests = testCase.generated_tests
      }
    } catch (e) {
      console.error("Error parsing generated_tests:", e)
    }

    const processedTestCase = {
      ...testCase,
      specification_id: testCase.specification_id || generatedTests.specification_id,
      design_id: testCase.design_id || generatedTests.design_id,
      generated_code_id: testCase.generated_code_id || generatedTests.generated_code_id,
      uploaded_file_url: generatedTests.uploaded_file_url || null,
      uploaded_file_name: generatedTests.uploaded_file_name || null,
    }

    // Get specification data if available
    let specificationData = null
    if (processedTestCase.specification_id) {
      try {
        const { data: specData, error: specError } = await supabase
          .from("specifications")
          .select("app_name")
          .eq("id", processedTestCase.specification_id)
          .single()

        if (!specError && specData) {
          specificationData = specData
        }
      } catch (error) {
        console.error("Error fetching specification:", error)
      }
    }

    // Get design data if available
    let designData = null
    if (processedTestCase.design_id) {
      try {
        const { data: desData, error: desError } = await supabase
          .from("designs")
          .select("type")
          .eq("id", processedTestCase.design_id)
          .single()

        if (!desError && desData) {
          designData = desData
        }
      } catch (error) {
        console.error("Error fetching design:", error)
      }
    }

    // Get code generation data if available
    let codeData = null
    if (processedTestCase.generated_code_id) {
      try {
        const { data: genData, error: genError } = await supabase
          .from("code_generations")
          .select("language, framework")
          .eq("id", processedTestCase.generated_code_id)
          .single()

        if (!genError && genData) {
          codeData = genData
        }
      } catch (error) {
        console.error("Error fetching code generation:", error)
      }
    }

    const enhancedData = {
      ...processedTestCase,
      specifications: specificationData,
      designs: designData,
      code_generations: codeData,
    }

    console.log("Successfully fetched test case:", enhancedData?.id)
    return { success: true, data: enhancedData }
  } catch (error) {
    console.error("Error in getTestCasesById:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteTestCase(id) {
  try {
    if (!id) {
      console.error("No test ID provided")
      return { success: false, error: "No test ID provided" }
    }

    console.log(`Attempting to delete test case with ID: ${id}`)

    // Use the admin client to bypass RLS
    const supabase = getSupabaseAdmin()

    // First verify the test case exists
    const { data: testCase, error: checkError } = await supabase.from("test_cases").select("id").eq("id", id).single()

    if (checkError) {
      console.error("Error checking test case existence:", checkError)

      // If the error is that the record doesn't exist, we'll still return success
      // since the end result is the same - the record is not in the database
      if (checkError.code === "PGRST116") {
        console.log("Test case not found, but that's okay - it's already gone")
        revalidatePath("/testing")
        revalidatePath("/testing/saved")
        return { success: true }
      }

      return { success: false, error: `Test case not found: ${checkError.message}` }
    }

    // Proceed with deletion
    const { error } = await supabase.from("test_cases").delete().eq("id", id)

    if (error) {
      console.error("Error deleting test case:", error)
      return { success: false, error: error.message }
    }

    console.log(`Successfully deleted test case with ID: ${id}`)

    // Revalidate paths
    revalidatePath("/testing")
    revalidatePath("/testing/saved")

    return { success: true }
  } catch (error) {
    console.error("Error in deleteTestCase:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}
