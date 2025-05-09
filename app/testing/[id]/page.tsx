import type { Metadata } from "next"
import { getTestCasesById } from "../actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileCode, TestTube } from "lucide-react"
import DownloadButton from "./download-button"
import DeleteTestButton from "../delete-test-button"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/code-block"

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
  console.log("Test case data:", JSON.stringify(testCase, null, 2))

  // Parse the generated_tests JSON if it's a string
  let testCode = "No test code available"
  let testCases = []
  let uploadedFileUrl = null
  let uploadedFileName = null

  try {
    // First, try to extract the test cases and metadata
    if (typeof testCase.generated_tests === "string") {
      try {
        // Check if it's a JSON string
        if (testCase.generated_tests.trim().startsWith("{")) {
          const parsedJson = JSON.parse(testCase.generated_tests)
          console.log("Successfully parsed JSON:", JSON.stringify(parsedJson, null, 2))

          // Extract test cases
          testCases = parsedJson.testCases || parsedJson.cases || []

          // Extract file info
          uploadedFileUrl = parsedJson.uploadedFileUrl || null
          uploadedFileName = parsedJson.uploadedFileName || null

          // Now generate proper test code from the test cases
          if (testCases.length > 0) {
            // Generate a proper Jest test file based on the test cases
            testCode = generateTestCodeFromCases(testCase.component_to_test, testCases, testCase.framework)
          } else if (parsedJson.testCode) {
            // If there's already test code in the JSON, use that
            testCode = parsedJson.testCode
          } else if (parsedJson.generatedCode) {
            // Or try this field
            testCode = parsedJson.generatedCode
          }
        } else {
          // If it's not JSON, use it directly as the test code
          console.log("Using generated_tests directly as it's not JSON")
          testCode = testCase.generated_tests
        }
      } catch (jsonError) {
        console.error("Error parsing generated_tests as JSON:", jsonError)
        // If parsing fails, use the raw string as the test code
        testCode = testCase.generated_tests
      }
    } else if (testCase.generated_tests && typeof testCase.generated_tests === "object") {
      // If it's already an object, extract the data
      console.log("generated_tests is already an object:", JSON.stringify(testCase.generated_tests, null, 2))

      // Extract test cases
      testCases = testCase.generated_tests.testCases || testCase.generated_tests.cases || []

      // Extract file info
      uploadedFileUrl = testCase.generated_tests.uploadedFileUrl || null
      uploadedFileName = testCase.generated_tests.uploadedFileName || null

      // Extract or generate test code
      if (testCase.generated_tests.testCode) {
        testCode = testCase.generated_tests.testCode
      } else if (testCase.generated_tests.generatedCode) {
        testCode = testCase.generated_tests.generatedCode
      } else if (testCases.length > 0) {
        // Generate test code from cases if no code is available
        testCode = generateTestCodeFromCases(testCase.component_to_test, testCases, testCase.framework)
      }
    }

    // If we still don't have proper test code, try to generate it from the test cases
    if (testCode === "No test code available" && testCases.length > 0) {
      testCode = generateTestCodeFromCases(testCase.component_to_test, testCases, testCase.framework)
    }
  } catch (e) {
    console.error("Error processing test case data:", e)
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{testCase.name || "Test Case"}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary">{testCase.test_type} tests</Badge>
            <Badge variant="secondary">{testCase.framework}</Badge>
            {testCase.specifications && <Badge variant="outline">{testCase.specifications.app_name}</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          <DownloadButton testCode={testCode} testName={testCase.name || "test"} framework={testCase.framework} />
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
              <CardDescription>{testCases.length || 0} test cases defined</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {testCases.map((testCase, index) => (
                  <li key={index} className="border-b pb-3 last:border-0 last:pb-0">
                    <p className="font-medium">{testCase.description}</p>
                    <p className="text-sm text-muted-foreground">Expects: {testCase.expectation}</p>
                  </li>
                ))}
                {(!testCases || testCases.length === 0) && (
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
            <CodeBlock code={testCode} language={getLanguageFromFramework(testCase.framework)} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
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

// Helper function to determine the language for syntax highlighting
function getLanguageFromFramework(framework: string): string {
  if (!framework) return "javascript"

  const lowercaseFramework = framework.toLowerCase()

  if (lowercaseFramework.includes("typescript") || lowercaseFramework.includes("ts")) {
    return "typescript"
  } else if (lowercaseFramework.includes("jsx") || lowercaseFramework.includes("react")) {
    return "jsx"
  } else {
    return "javascript"
  }
}
