import type { Metadata } from "next"
import { getTestCasesById } from "../actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileCode, TestTube } from "lucide-react"
import { DownloadButton } from "./download-button"
import { DeleteTestButton } from "../delete-test-button"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const result = await getTestCasesById(params.id)
  const testCase = result.success ? result.data : null

  return {
    title: testCase ? `${testCase.name} | Test Case` : "Test Case",
    description: testCase ? `View details for test case: ${testCase.name}` : "Test case details",
  }
}

export default async function TestCasePage({ params }: { params: { id: string } }) {
  const result = await getTestCasesById(params.id)

  if (!result.success) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Failed to load test case</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{result.error || "An error occurred while loading the test case."}</p>
            <Button asChild className="mt-4">
              <Link href="/testing">Back to Testing</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const testCase = result.data

  // Parse the generated_tests JSON if it's a string
  let parsedTests = { cases: [], generatedCode: "" }
  try {
    if (typeof testCase.generated_tests === "string") {
      parsedTests = JSON.parse(testCase.generated_tests)
    } else if (testCase.generated_tests && typeof testCase.generated_tests === "object") {
      parsedTests = testCase.generated_tests
    }
  } catch (e) {
    console.error("Error parsing generated_tests:", e)
  }

  // Extract uploaded file information
  const uploadedFileUrl = testCase.uploaded_file_url || parsedTests.uploaded_file_url
  const uploadedFileName = testCase.uploaded_file_name || parsedTests.uploaded_file_name

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{testCase.name}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary">{testCase.test_type} tests</Badge>
            <Badge variant="secondary">{testCase.framework}</Badge>
            {testCase.specifications && <Badge variant="outline">{testCase.specifications.app_name}</Badge>}
            {testCase.designs && <Badge variant="outline">{testCase.designs.type} design</Badge>}
            {testCase.code_generations && (
              <Badge variant="outline">
                {testCase.code_generations.language} / {testCase.code_generations.framework}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <DownloadButton
            testCode={parsedTests.generatedCode || ""}
            testName={testCase.name}
            framework={testCase.framework}
          />
          <DeleteTestButton id={testCase.id} redirectTo="/testing" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Component</h3>
                <p className="font-mono text-sm">{testCase.component_to_test}</p>
              </div>
              <div>
                <h3 className="font-medium">Created</h3>
                <p className="text-sm">{new Date(testCase.created_at).toLocaleString()}</p>
              </div>
              {uploadedFileName && (
                <div>
                  <h3 className="font-medium">Uploaded File</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <FileCode className="h-4 w-4" />
                    <a
                      href={uploadedFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {uploadedFileName}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Cases</CardTitle>
              <CardDescription>{parsedTests.cases?.length || 0} test cases defined</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {parsedTests.cases?.map((testCase, index) => (
                  <li key={index} className="border-b pb-3 last:border-0 last:pb-0">
                    <p className="font-medium">{testCase.description}</p>
                    <p className="text-sm text-muted-foreground">Expects: {testCase.expectation}</p>
                  </li>
                ))}
                {(!parsedTests.cases || parsedTests.cases.length === 0) && (
                  <li className="text-muted-foreground text-sm">No test cases found</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Generated Test Code
            </CardTitle>
            <CardDescription>
              {testCase.framework} tests for {testCase.component_to_test}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[600px] text-sm font-mono whitespace-pre-wrap">
              {parsedTests.generatedCode || "No test code available"}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
