"use server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { generateAIText } from "@/lib/ai-service"
import { revalidatePath } from "next/cache"

// Add the missing function
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

// Other functions remain the same...

export async function saveTestCases({
  testType,
  framework,
  componentToTest,
  testCases,
  generatedTests,
  specificationId,
  designId = null,
  generatedCodeId = null,
  name = "Generated Tests",
}) {
  try {
    console.log("Saving test cases with:", {
      testType,
      framework,
      componentToTest,
      testCasesCount: testCases?.length,
      specificationId,
      designId,
      generatedCodeId,
      name,
    })

    // Use the admin client to bypass RLS
    const supabase = getSupabaseAdmin()

    // First, ensure the table exists with all required columns
    await ensureTestCasesTable(supabase)

    // Create a data object that matches the actual table schema
    // Only include fields we know exist in the table
    const testCaseData = {
      name: name,
      test_type: testType,
      framework: framework,
      component_to_test: componentToTest,
      generated_tests: JSON.stringify({
        cases: testCases,
        generatedCode: generatedTests,
        // Store related IDs in the JSON if the columns don't exist
        specification_id: specificationId,
        design_id: designId,
        generated_code_id: generatedCodeId,
      }),
      // Only include these if we've confirmed the columns exist
      ...(specificationId ? { specification_id: specificationId } : {}),
    }

    // Save the test cases
    const { data, error } = await supabase.from("test_cases").insert([testCaseData]).select()

    if (error) {
      console.error("Error saving test cases:", error)

      // If the error is about missing columns, try a simplified version
      if (error.message.includes("column") && error.message.includes("does not exist")) {
        console.log("Trying simplified insert without problematic columns...")

        // Create a simplified data object without the problematic columns
        const simplifiedData = {
          name: name,
          test_type: testType,
          framework: framework,
          component_to_test: componentToTest,
          generated_tests: JSON.stringify({
            cases: testCases,
            generatedCode: generatedTests,
            specification_id: specificationId,
            design_id: designId,
            generated_code_id: generatedCodeId,
          }),
        }

        // Try the insert again with simplified data
        const { data: simplifiedResult, error: simplifiedError } = await supabase
          .from("test_cases")
          .insert([simplifiedData])
          .select()

        if (simplifiedError) {
          console.error("Error with simplified insert:", simplifiedError)
          return { success: false, error: simplifiedError.message }
        }

        // Revalidate paths
        revalidatePath("/testing")
        revalidatePath("/testing/saved")

        return { success: true, data: simplifiedResult[0] }
      }

      return { success: false, error: error.message }
    }

    // Revalidate paths
    revalidatePath("/testing")
    revalidatePath("/testing/saved")

    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error in saveTestCases:", error)
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

// Rest of the file remains the same...

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

export async function generateAITestCases({
  testType,
  framework,
  componentToTest,
  componentDescription,
  specificationData,
  designData,
  generatedCodeData,
}) {
  try {
    console.log("Generating AI test cases with:", {
      testType,
      framework,
      componentToTest,
      hasSpecData: !!specificationData,
      hasDesignData: !!designData,
      hasCodeData: !!generatedCodeData,
    })

    // Create a prompt for the AI to generate test cases
    let prompt = `
Generate comprehensive ${testType} tests for a React component named "${componentToTest}" using the ${framework} testing framework.

${componentDescription ? `Component description: ${componentDescription}` : ""}
`

    // Add specification data if available
    if (specificationData) {
      prompt += `
Application specification:
- Name: ${specificationData.app_name || "N/A"}
- Type: ${specificationData.app_type || "N/A"}
- Description: ${specificationData.app_description || "N/A"}
${
  specificationData.functional_requirements
    ? `- Functional Requirements: ${specificationData.functional_requirements.substring(0, 500)}...`
    : ""
}
`
    }

    // Add design data if available
    if (designData) {
      prompt += `
Design information:
- Type: ${designData.type || "N/A"}
- Description: ${designData.description ? designData.description.substring(0, 300) + "..." : "N/A"}
`
    }

    // Add generated code if available
    if (generatedCodeData) {
      prompt += `
Generated code to test:
\`\`\`${generatedCodeData.language}
${generatedCodeData.generated_code ? generatedCodeData.generated_code.substring(0, 1000) + "..." : "N/A"}
\`\`\`
`
    }

    prompt += `
Please generate:
1. A list of test cases with descriptions and expected outcomes
2. The complete test code implementation using ${framework} and React Testing Library

Format the response as follows:

TEST_CASES_START
[
  {
    "description": "should render correctly",
    "expectation": "component renders without errors"
  },
  // more test cases...
]
TEST_CASES_END

TEST_CODE_START
// Complete test code implementation here...
TEST_CODE_END

This format helps me parse your response correctly. Do not use backticks inside the JSON array of test cases.
`

    const systemPrompt = `
You are an expert test engineer specializing in React testing. Your task is to generate comprehensive test cases and implementation code for React components.
Follow best practices for ${framework} and React Testing Library.
Include tests for rendering, user interactions, error states, and edge cases.
Make sure the generated code is valid JavaScript/TypeScript that would work in a real project.
If you're given generated code to test, analyze it carefully and create tests that verify its functionality.

IMPORTANT: Format your response exactly as requested with TEST_CASES_START/END and TEST_CODE_START/END markers.
The test cases must be valid JSON. Do not use backticks inside the JSON array.
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

    // Parse the AI response using the markers
    try {
      const responseText = result.text || ""
      console.log("AI response received, length:", responseText.length)

      // Extract test cases using markers
      let testCases = []
      if (responseText.includes("TEST_CASES_START") && responseText.includes("TEST_CASES_END")) {
        const testCasesJson = responseText.split("TEST_CASES_START")[1].split("TEST_CASES_END")[0].trim()

        console.log("Extracted test cases JSON:", testCasesJson.substring(0, 100) + "...")

        try {
          testCases = JSON.parse(testCasesJson)
        } catch (jsonError) {
          console.error("Error parsing test cases JSON:", jsonError)
          // Fallback to regex extraction of individual test cases
          const testCaseRegex = /"description":\s*"([^"]+)",\s*"expectation":\s*"([^"]+)"/g
          const matches = [...testCasesJson.matchAll(testCaseRegex)]
          testCases = matches.map((match) => ({
            description: match[1],
            expectation: match[2],
          }))

          if (testCases.length === 0) {
            // Last resort fallback
            testCases = [
              { description: "should render correctly", expectation: "component renders without errors" },
              { description: "should handle user interactions", expectation: "component responds to user actions" },
            ]
          }
        }
      } else {
        console.log("TEST_CASES markers not found, using fallback extraction")
        // Fallback to default test cases
        testCases = [
          { description: "should render correctly", expectation: "component renders without errors" },
          { description: "should handle user interactions", expectation: "component responds to user actions" },
        ]
      }

      // Extract test code using markers
      let testCode = ""
      if (responseText.includes("TEST_CODE_START") && responseText.includes("TEST_CODE_END")) {
        testCode = responseText.split("TEST_CODE_START")[1].split("TEST_CODE_END")[0].trim()
      } else {
        console.log("TEST_CODE markers not found, extracting code blocks")
        // Try to extract code from code blocks
        const codeBlockRegex = /```(?:javascript|typescript|jsx|tsx)?\n([\s\S]+?)```/g
        const codeBlocks = [...responseText.matchAll(codeBlockRegex)]
        if (codeBlocks.length > 0) {
          testCode = codeBlocks[0][1]
        } else {
          // Last resort: just use the whole response as code
          testCode = responseText
        }
      }

      return {
        success: true,
        testCases,
        testCode,
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError)

      // If we can't parse the response, return default test cases and the raw text as code
      return {
        success: true,
        testCases: [
          { description: "should render correctly", expectation: "component renders without errors" },
          { description: "should handle user interactions", expectation: "component responds to user actions" },
        ],
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
