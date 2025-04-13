"use server"

import { getSupabase } from "@/lib/supabase"

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
    const supabase = getSupabase()

    // Create a data object with common field names
    // We'll try different field combinations since we don't know the exact schema
    const testCaseData = {
      name: name,
      test_type: testType,
      framework: framework,
      component: componentToTest,
      specification_id: specificationId,
      // Store the test cases and generated code as JSON strings
      test_data: JSON.stringify({
        cases: testCases,
        generatedCode: generatedTests,
      }),
    }

    // Save the test cases
    const { data, error } = await supabase.from("test_cases").insert(testCaseData).select()

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
    const supabase = getSupabase()

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
    const supabase = getSupabase()

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
