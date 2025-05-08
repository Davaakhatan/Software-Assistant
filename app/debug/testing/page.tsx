import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function TestingDebugPage() {
  const supabase = getSupabaseAdmin()

  // Check if the test_cases table exists by trying to query it
  let tableExists = false
  let tableStructure = null
  let tableData = null
  let error = null
  let foreignKeys = null

  try {
    // Try to query the table
    const { data, error: queryError } = await supabase.from("test_cases").select("id").limit(1)

    if (queryError) {
      if (queryError.message.includes("relation") && queryError.message.includes("does not exist")) {
        tableExists = false
      } else {
        error = queryError.message
      }
    } else {
      tableExists = true

      // Get table columns using SQL
      const { data: columnsData, error: columnsError } = await supabase.sql(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'test_cases'
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `)

      if (columnsError) {
        error = columnsError.message
      } else {
        tableStructure = columnsData
      }

      // Get sample data
      const { data: rows, error: rowsError } = await supabase.from("test_cases").select("*").limit(5)

      if (rowsError) {
        error = error || rowsError.message
      } else {
        tableData = rows
      }

      // Get foreign keys
      const { data: fkData, error: fkError } = await supabase.sql(`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS referenced_table_name,
          ccu.column_name AS referenced_column_name
        FROM
          information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE
          tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'test_cases'
          AND tc.table_schema = 'public';
      `)

      if (fkError) {
        // Just log this error, don't fail the whole page
        console.error("Error fetching foreign keys:", fkError)
      } else {
        foreignKeys = fkData
      }
    }
  } catch (e) {
    error = e.message
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Testing Module Debug</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/testing">Go to Testing</Link>
          </Button>
          <Button asChild>
            <Link href="/debug">Back to Debug</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Cases Table Status</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="p-4 bg-red-50 text-red-800 rounded-md">
              <h3 className="font-bold">Error</h3>
              <p>{error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Table Exists:</h3>
                <p className={tableExists ? "text-green-600" : "text-red-600"}>{tableExists ? "Yes" : "No"}</p>
              </div>

              {tableStructure && (
                <div>
                  <h3 className="font-medium">Table Structure:</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 mt-2">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Column Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nullable
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tableStructure.map((column, i) => (
                          <tr key={i}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {column.column_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{column.data_type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{column.is_nullable}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {foreignKeys && foreignKeys.length > 0 && (
                <div>
                  <h3 className="font-medium">Foreign Keys:</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 mt-2">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Constraint
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Column
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            References
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {foreignKeys.map((fk, i) => (
                          <tr key={i}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {fk.constraint_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fk.column_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {fk.referenced_table_name}.{fk.referenced_column_name}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tableData && (
                <div>
                  <h3 className="font-medium">Sample Data ({tableData.length} rows):</h3>
                  {tableData.length === 0 ? (
                    <p className="text-amber-600 mt-2">No data found in the table.</p>
                  ) : (
                    <div className="overflow-x-auto mt-2">
                      <pre className="bg-gray-50 p-4 rounded-md text-xs overflow-auto max-h-96">
                        {JSON.stringify(tableData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setup Test Cases Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              If the test_cases table doesn't exist or has issues, you can run the setup script to create or fix it.
            </p>
            <Button asChild>
              <Link href="/testing/setup">Run Setup Script</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fix Foreign Key Relationships</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>If you're having issues with foreign key relationships, you can run the following SQL to fix them:</p>
            <pre className="bg-gray-50 p-4 rounded-md text-xs overflow-auto">
              {`-- Check if foreign keys exist and create them if they don't
DO $$
BEGIN
  -- Add foreign key for specification_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'test_cases_specification_id_fkey' 
    AND table_name = 'test_cases'
  ) THEN
    ALTER TABLE test_cases 
    ADD CONSTRAINT test_cases_specification_id_fkey 
    FOREIGN KEY (specification_id) 
    REFERENCES specifications(id) ON DELETE SET NULL;
  END IF;

  -- Add foreign key for design_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'test_cases_design_id_fkey' 
    AND table_name = 'test_cases'
  ) THEN
    ALTER TABLE test_cases 
    ADD CONSTRAINT test_cases_design_id_fkey 
    FOREIGN KEY (design_id) 
    REFERENCES designs(id) ON DELETE SET NULL;
  END IF;

  -- Add foreign key for generated_code_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'test_cases_generated_code_id_fkey' 
    AND table_name = 'test_cases'
  ) THEN
    ALTER TABLE test_cases 
    ADD CONSTRAINT test_cases_generated_code_id_fkey 
    FOREIGN KEY (generated_code_id) 
    REFERENCES code_generations(id) ON DELETE SET NULL;
  END IF;
END $$;`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
