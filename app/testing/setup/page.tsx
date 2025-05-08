import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { revalidatePath } from "next/cache"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Testing Database Setup",
  description: "Set up the database tables for the testing module",
}

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function TestingSetupPage() {
  const supabase = getSupabaseAdmin()

  // Check if the test_cases table exists by trying to query it
  let tableExists = false
  let setupResult = null
  let setupError = null

  try {
    // Try to query the table
    const { data, error: queryError } = await supabase.from("test_cases").select("id").limit(1)

    if (queryError) {
      if (queryError.message.includes("relation") && queryError.message.includes("does not exist")) {
        tableExists = false
      } else {
        setupError = `Error checking table: ${queryError.message}`
      }
    } else {
      tableExists = true
    }
  } catch (e) {
    setupError = `Error checking table: ${e.message}`
  }

  if (!setupError && !tableExists) {
    // Table doesn't exist, create it
    try {
      const { error } = await supabase.sql(`
        CREATE TABLE IF NOT EXISTS test_cases (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT,
          test_type TEXT,
          framework TEXT,
          component_to_test TEXT,
          generated_tests JSONB,
          specification_id UUID REFERENCES specifications(id) ON DELETE SET NULL,
          design_id UUID REFERENCES designs(id) ON DELETE SET NULL,
          generated_code_id UUID REFERENCES code_generations(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS test_cases_specification_id_idx ON test_cases(specification_id);
        CREATE INDEX IF NOT EXISTS test_cases_design_id_idx ON test_cases(design_id);
        CREATE INDEX IF NOT EXISTS test_cases_generated_code_id_idx ON test_cases(generated_code_id);
        CREATE INDEX IF NOT EXISTS test_cases_created_at_idx ON test_cases(created_at);
      `)

      if (error) {
        setupError = `Error creating test_cases table: ${error.message}`
      } else {
        setupResult = "Table created successfully."
        revalidatePath("/testing")
      }
    } catch (e) {
      setupError = `Error creating table: ${e.message}`
    }
  } else if (!setupError && tableExists) {
    // Table exists, check if it has all required columns
    try {
      const { data: columnsData, error: columnsError } = await supabase.sql(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'test_cases'
        AND table_schema = 'public';
      `)

      if (columnsError) {
        setupError = `Error checking columns: ${columnsError.message}`
      } else {
        const columnNames = columnsData.map((c) => c.column_name)
        const requiredColumns = [
          "id",
          "name",
          "test_type",
          "framework",
          "component_to_test",
          "generated_tests",
          "specification_id",
          "design_id",
          "generated_code_id",
          "created_at",
          "updated_at",
        ]

        const missingColumns = requiredColumns.filter((col) => !columnNames.includes(col))

        if (missingColumns.length > 0) {
          // Add missing columns
          const alterTableErrors = []

          for (const column of missingColumns) {
            let dataType = "TEXT"
            let constraints = ""

            if (column === "id") {
              dataType = "UUID"
              constraints = "PRIMARY KEY DEFAULT gen_random_uuid()"
            } else if (column === "generated_tests") {
              dataType = "JSONB"
            } else if (column.endsWith("_id")) {
              dataType = "UUID"

              // Add foreign key reference based on column name
              if (column === "specification_id") {
                constraints = "REFERENCES specifications(id) ON DELETE SET NULL"
              } else if (column === "design_id") {
                constraints = "REFERENCES designs(id) ON DELETE SET NULL"
              } else if (column === "generated_code_id") {
                constraints = "REFERENCES code_generations(id) ON DELETE SET NULL"
              }
            } else if (column === "created_at" || column === "updated_at") {
              dataType = "TIMESTAMP WITH TIME ZONE"
              constraints = "DEFAULT NOW()"
            }

            try {
              const { error } = await supabase.sql(`
                ALTER TABLE test_cases 
                ADD COLUMN IF NOT EXISTS ${column} ${dataType} ${constraints};
              `)

              if (error) {
                alterTableErrors.push(`Error adding column ${column}: ${error.message}`)
              }
            } catch (e) {
              alterTableErrors.push(`Error adding column ${column}: ${e.message}`)
            }
          }

          if (alterTableErrors.length > 0) {
            setupError = alterTableErrors.join("\n")
          } else {
            setupResult = `Added missing columns: ${missingColumns.join(", ")}`
            revalidatePath("/testing")
          }
        } else {
          setupResult = "Table exists and has all required columns."
        }
      }
    } catch (e) {
      setupError = `Error checking columns: ${e.message}`
    }
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Testing Module Setup</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/testing">Go to Testing</Link>
          </Button>
          <Button asChild>
            <Link href="/debug/testing">View Debug Info</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Setup Status</CardTitle>
        </CardHeader>
        <CardContent>
          {setupError ? (
            <div className="p-4 bg-red-50 text-red-800 rounded-md">
              <h3 className="font-bold">Error</h3>
              <pre className="whitespace-pre-wrap text-sm mt-2">{setupError}</pre>
            </div>
          ) : setupResult ? (
            <div className="p-4 bg-green-50 text-green-800 rounded-md">
              <h3 className="font-bold">Success</h3>
              <p className="mt-2">{setupResult}</p>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 text-blue-800 rounded-md">
              <h3 className="font-bold">Checking setup...</h3>
              <p className="mt-2">Verifying test_cases table structure...</p>
            </div>
          )}

          <div className="mt-6">
            <h3 className="font-medium mb-2">Next Steps:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <Link href="/testing" className="text-blue-600 hover:underline">
                  Go to the Testing page
                </Link>{" "}
                to generate and manage test cases.
              </li>
              <li>
                <Link href="/debug/testing" className="text-blue-600 hover:underline">
                  View debug information
                </Link>{" "}
                to see detailed table structure and sample data.
              </li>
              <li>If you're still experiencing issues, try refreshing this page to run the setup again.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
