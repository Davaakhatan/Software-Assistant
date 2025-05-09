"use server"

import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { revalidatePath } from "next/cache"
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

// Update the saveTestCases function to generate and store proper test code
export async function saveTestCases(params: {
  testType: string
  framework: string
  componentToTest: string
  testCases: Array<{ description: string; expectation: string }>
  generatedTests: string
  rawTestCode?: string
  specificationId: string | null
  designId: string | null
  generatedCodeId: string | null
  name: string
  uploadedFileUrl?: string | null
  uploadedFileName?: string | null
}) {
  try {
    console.log(
      "Saving test cases with params:",
      JSON.stringify({
        ...params,
        generatedTests: params.generatedTests ? "..." : null,
        rawTestCode: params.rawTestCode ? "..." : null,
      }),
    )

    // Use the admin client to bypass RLS
    const supabase = getSupabaseAdmin()

    // Create a JSON object with all the test data
    const testData = {
      testCases: params.testCases,
      designId: params.designId,
      generatedCodeId: params.generatedCodeId,
      uploadedFileUrl: params.uploadedFileUrl,
      uploadedFileName: params.uploadedFileName,
      // Include the raw test code if available
      testCode:
        params.rawTestCode || generateTestCodeFromCases(params.componentToTest, params.testCases, params.framework),
    }

    // Prepare the data to insert
    const insertData = {
      name: params.name,
      test_type: params.testType,
      framework: params.framework,
      component_to_test: params.componentToTest,
      component: params.componentToTest,
      specification_id: params.specificationId,
      generated_tests: JSON.stringify(testData),
    }

    console.log(
      "Inserting test case with data:",
      JSON.stringify({
        ...insertData,
        generated_tests: "...",
      }),
    )

    // Insert the test case into the database
    const { data, error } = await supabase.from("test_cases").insert(insertData).select()

    if (error) {
      console.error("Error saving test cases:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    console.log("Test case saved successfully:", data[0].id)
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

// Helper function to generate test code from test cases
function generateTestCodeFromCases(componentName: string, testCases: any[], framework: string): string {
  if (!testCases || testCases.length === 0) {
    return "No test cases available to generate code"
  }

  // Default to Jest if framework is not specified
  const testFramework = framework?.toLowerCase() || "jest"

  if (testFramework.includes("jest")) {
    return `// Generated Jest tests for ${componentName}
import { ${componentName.includes("is") ? "" : "render, screen, fireEvent"} } from '${componentName.includes("is") ? "./" + componentName : "@testing-library/react"}';
${componentName.includes("is") ? "" : `import ${componentName} from './${componentName}';`}

describe('${componentName}', () => {
  ${testCases
    .map(
      (tc) => `test('${tc.description}', () => {
    ${generateTestImplementation(componentName, tc, testFramework)}
  });`,
    )
    .join("\n\n  ")}
});`
  } else if (testFramework.includes("cypress")) {
    return `// Generated Cypress tests for ${componentName}
describe('${componentName}', () => {
  beforeEach(() => {
    cy.visit('/path-to-component');
  });

  ${testCases
    .map(
      (tc) => `it('${tc.description}', () => {
    ${generateTestImplementation(componentName, tc, testFramework)}
  });`,
    )
    .join("\n\n  ")}
});`
  } else if (testFramework.includes("mocha")) {
    return `// Generated Mocha tests for ${componentName}
import { expect } from 'chai';
${componentName.includes("is") ? "" : `import { render, screen } from '@testing-library/react';`}
${componentName.includes("is") ? "" : `import ${componentName} from './${componentName}';`}

describe('${componentName}', () => {
  ${testCases
    .map(
      (tc) => `it('${tc.description}', () => {
    ${generateTestImplementation(componentName, tc, testFramework)}
  });`,
    )
    .join("\n\n  ")}
});`
  } else {
    // Generic test format
    return `// Generated tests for ${componentName} using ${framework}
describe('${componentName}', () => {
  ${testCases
    .map(
      (tc) => `test('${tc.description}', () => {
    ${generateTestImplementation(componentName, tc, testFramework)}
  });`,
    )
    .join("\n\n  ")}
});`
  }
}

// Helper function to generate test implementation based on the test case
function generateTestImplementation(componentName: string, testCase: any, framework: string): string {
  const { description, expectation } = testCase

  // Check if this is a function test (like isPalindrome) or a component test
  if (componentName.startsWith("is") || description.toLowerCase().includes("function")) {
    // Function test
    if (expectation.includes("should return true")) {
      const match = expectation.match(/isPalindrome$$([^)]+)$$/)
      const input = match ? match[1] : "input"
      return `expect(${componentName}(${input})).toBe(true);`
    } else if (expectation.includes("should return false")) {
      const match = expectation.match(/isPalindrome$$([^)]+)$$/)
      const input = match ? match[1] : "input"
      return `expect(${componentName}(${input})).toBe(false);`
    } else {
      return `// Test implementation for: ${expectation}
    // Add your assertions here`
    }
  } else {
    // Component test
    if (description.includes("render")) {
      return `render(<${componentName} />);
    expect(screen.getByTestId('${componentName.toLowerCase()}')).toBeInTheDocument();`
    } else if (description.includes("prop") || description.includes("property")) {
      return `render(<${componentName} testProp="test" />);
    expect(screen.getByText('test')).toBeInTheDocument();`
    } else if (description.includes("click") || description.includes("interaction")) {
      return `render(<${componentName} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    // Add assertions for the expected behavior after click`
    } else {
      return `// Test implementation for: ${expectation}
    // Add your assertions here`
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
        specification_id: testCase.specification_id || generatedTests.specificationId,
        design_id: generatedTests.designId || null,
        generated_code_id: generatedTests.generatedCodeId || null,
        uploaded_file_url: generatedTests.uploadedFileUrl || null,
        uploaded_file_name: generatedTests.uploadedFileName || null,
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

    console.log("Raw test case data:", JSON.stringify(testCase, null, 2))

    // Extract related IDs from JSON if they're not in the table columns
    let generatedTests = {}
    try {
      if (typeof testCase.generated_tests === "string") {
        generatedTests = JSON.parse(testCase.generated_tests)
        console.log("Parsed generated_tests:", JSON.stringify(generatedTests, null, 2))
      } else if (testCase.generated_tests && typeof testCase.generated_tests === "object") {
        generatedTests = testCase.generated_tests
        console.log("Object generated_tests:", JSON.stringify(generatedTests, null, 2))
      }
    } catch (e) {
      console.error("Error parsing generated_tests:", e)
      console.log("Raw generated_tests:", testCase.generated_tests)
    }

    const processedTestCase = {
      ...testCase,
      specification_id: testCase.specification_id || generatedTests.specificationId,
      design_id: generatedTests.designId || null,
      generated_code_id: generatedTests.generatedCodeId || null,
      uploaded_file_url: generatedTests.uploadedFileUrl || null,
      uploaded_file_name: generatedTests.uploadedFileName || null,
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
