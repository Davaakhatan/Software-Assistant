import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"
import fs from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const { language, framework, requirements, specificationId, designId } = await request.json()

    // Simple validation
    if (!language || !framework) {
      return NextResponse.json({ success: false, error: "Language and framework are required" }, { status: 400 })
    }

    // Check if the code_generations table exists
    const supabase = getSupabaseServer()

    try {
      // Try to query the table to see if it exists
      const { error: tableCheckError } = await supabase.from("code_generations").select("id").limit(1)

      // If there's an error and it mentions the table doesn't exist, create it
      if (tableCheckError && tableCheckError.message.includes("does not exist")) {
        console.log("Table 'code_generations' does not exist, creating it...")

        try {
          // Read the SQL file
          const sqlFilePath = path.join(process.cwd(), "app/code-generation/setup-code-generations-table.sql")
          const sqlQuery = fs.readFileSync(sqlFilePath, "utf8")

          // Execute the SQL directly
          const { error: createTableError } = await supabase.rpc("exec_sql", { query: sqlQuery })

          if (createTableError) {
            console.error("Error creating table:", createTableError)
            return NextResponse.json(
              { success: false, error: `Error creating table: ${createTableError.message}` },
              { status: 500 },
            )
          }
        } catch (error) {
          console.error("Error creating generated_code table:", error)
          return NextResponse.json({ success: false, error: "Error creating generated_code table" }, { status: 500 })
        }
      }
    } catch (error) {
      console.error("Error checking if table exists:", error)
    }

    // Generate a simple code example for demonstration
    const generatedCode = `// Generated ${language} code using ${framework}
// Based on requirements: ${requirements || "None provided"}
${specificationId ? "// Using specification ID: " + specificationId : ""}
${designId ? "// Using design ID: " + designId : ""}

function main() {
  console.log("Hello from generated code!");
  return "Generated successfully";
}

export default main;`

    // Insert the generated code into the database
    const { data, error } = await supabase
      .from("code_generations")
      .insert([
        {
          generated_code: generatedCode,
          language,
          framework,
          requirements: requirements || null,
          specification_id: specificationId || null,
          design_id: designId || null,
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error("Error saving generated code:", error)
      return NextResponse.json(
        { success: false, error: `Error saving generated code: ${error.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      code: generatedCode,
      savedCode: data[0],
    })
  } catch (error) {
    console.error("Error generating code:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
