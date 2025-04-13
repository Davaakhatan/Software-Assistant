import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import TestCaseGenerator from "./test-case-generator"

export default function TestingPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center mb-8">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex flex-col items-start mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Test Automation</h1>
        <p className="text-muted-foreground">Generate and manage automated tests for your application</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <TestCaseGenerator />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Testing Best Practices</CardTitle>
              <CardDescription>Guidelines for effective test automation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Test Pyramid</h3>
                <p className="text-sm text-muted-foreground">
                  Focus on unit tests, followed by integration tests, and fewer UI tests.
                </p>
              </div>
              <div>
                <h3 className="font-medium">Arrange-Act-Assert</h3>
                <p className="text-sm text-muted-foreground">
                  Structure tests with setup, action, and verification phases.
                </p>
              </div>
              <div>
                <h3 className="font-medium">Test Independence</h3>
                <p className="text-sm text-muted-foreground">
                  Tests should not depend on each other and should be able to run in any order.
                </p>
              </div>
              <div>
                <h3 className="font-medium">Clean Test Data</h3>
                <p className="text-sm text-muted-foreground">Each test should create and clean up its own test data.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>After setting up tests</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Once you've created your tests, you can set up CI/CD pipelines or generate documentation.
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/cicd">
                  <Button variant="outline" className="w-full justify-start">
                    CI/CD Pipeline
                  </Button>
                </Link>
                <Link href="/documentation">
                  <Button variant="outline" className="w-full justify-start">
                    Documentation
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
