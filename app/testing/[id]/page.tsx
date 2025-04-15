import { getTestCasesById } from "../actions"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { notFound } from "next/navigation"
import DownloadButton from "./download-button"

export default async function TestPage({ params }) {
  const { id } = params
  const result = await getTestCasesById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const test = result.data

  // Parse the generated_tests JSON if it's a string
  let testData
  let testCases = []
  let generatedCode = ""

  try {
    if (typeof test.generated_tests === "string") {
      try {
        testData = JSON.parse(test.generated_tests)
        testCases = testData.cases || []
        generatedCode = testData.generatedCode || test.generated_tests
      } catch (e) {
        generatedCode = test.generated_tests
      }
    } else {
      testData = test.generated_tests
      testCases = testData.cases || []
      generatedCode = testData.generatedCode || ""
    }
  } catch (error) {
    console.error("Error parsing test data:", error)
    generatedCode = test.generated_tests || ""
  }

  const getTestTypeColor = (type) => {
    switch (type) {
      case "unit":
        return "bg-green-100 text-green-800"
      case "integration":
        return "bg-blue-100 text-blue-800"
      case "e2e":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getFrameworkColor = (framework) => {
    switch (framework) {
      case "jest":
        return "bg-red-100 text-red-800"
      case "vitest":
        return "bg-green-100 text-green-800"
      case "cypress":
        return "bg-blue-100 text-blue-800"
      case "playwright":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/testing" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Tests
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{test.name || "Unnamed Test"}</h1>
        <p className="text-muted-foreground">
          {test.created_at
            ? `Created on ${format(new Date(test.created_at), "MMM d, yyyy 'at' h:mm a")}`
            : "Creation date unknown"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Test Type</h3>
                <Badge className={getTestTypeColor(test.test_type)}>
                  {test.test_type?.charAt(0).toUpperCase() + test.test_type?.slice(1) || "Unknown"} Tests
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium">Framework</h3>
                <Badge className={getFrameworkColor(test.framework)}>
                  {test.framework?.charAt(0).toUpperCase() + test.framework?.slice(1) || "Unknown"}
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium">Component</h3>
                <p className="font-mono text-sm">{test.component_to_test || test.component || "Not specified"}</p>
              </div>

              {test.specification_id && (
                <div>
                  <h3 className="text-sm font-medium">Specification ID</h3>
                  <p className="font-mono text-xs truncate">{test.specification_id}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {testCases && testCases.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Test Cases</CardTitle>
                <CardDescription>Test scenarios covered in this test suite</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {testCases.map((testCase, index) => (
                    <li key={index} className="border-b pb-3 last:border-0 last:pb-0">
                      <h3 className="font-medium">{testCase.description}</h3>
                      <p className="text-sm text-muted-foreground">{testCase.expectation}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Generated Test Code</CardTitle>
              <CardDescription>
                {test.framework} test code for {test.component_to_test || test.component || "the component"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <pre className="bg-muted p-4 rounded-md overflow-auto h-[500px] text-sm font-mono whitespace-pre-wrap">
                {generatedCode}
              </pre>
            </CardContent>
            <CardFooter>
              <DownloadButton test={test} />
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
