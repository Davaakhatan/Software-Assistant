import { getSupabaseServer } from "@/lib/supabase-server"
import CodeGenerationForm from "./code-generation-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Code, AlertTriangle } from "lucide-react"

export default async function CodeGenerationPage() {
  const supabase = getSupabaseServer()

  // Fetch specifications with error handling
  const { data: specifications, error: specError } = await supabase
    .from("specifications")
    .select("id, app_name")
    .order("created_at", { ascending: false })

  // Fetch designs with error handling
  const { data: designs, error: designError } = await supabase
    .from("designs")
    .select("id, type, requirement_id, requirements(specification_id)")

  // Log for debugging
  console.log(`Fetched ${specifications?.length || 0} specifications and ${designs?.length || 0} designs`)

  if (specError) {
    console.error("Error fetching specifications:", specError)
  }

  if (designError) {
    console.error("Error fetching designs:", designError)
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Code Generation</h1>

      {specError && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Error Loading Specifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">
              There was an error loading your specifications. Please try refreshing the page.
            </p>
            <p className="text-sm text-red-500 mt-2">{specError.message}</p>
          </CardContent>
        </Card>
      )}

      <CodeGenerationForm specifications={specifications || []} designs={designs || []} />

      {/* Tips and Next Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Code Generation Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Code Generation Tips</CardTitle>
            <CardDescription>Get the most out of automatic code generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">Be Specific</h3>
              <p className="text-sm text-gray-600">
                The more detailed your requirements, the better the generated code.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Review Generated Code</h3>
              <p className="text-sm text-gray-600">Always review and understand the generated code before using it.</p>
            </div>

            <div>
              <h3 className="font-semibold">Iterative Approach</h3>
              <p className="text-sm text-gray-600">Generate code in small chunks and refine as needed.</p>
            </div>

            <div>
              <h3 className="font-semibold">Customize</h3>
              <p className="text-sm text-gray-600">
                Use generated code as a starting point and customize to your needs.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>After generating code</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600">
              Once you've generated your code, you can move on to testing or setting up CI/CD pipelines.
            </p>

            <div className="space-y-2">
              <Link href="/testing">
                <Button variant="outline" className="w-full">
                  Test Automation
                </Button>
              </Link>

              <Link href="/cicd">
                <Button variant="outline" className="w-full">
                  CI/CD Pipeline
                </Button>
              </Link>

              <Link href="/code-generation/saved">
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  View Saved Code
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
