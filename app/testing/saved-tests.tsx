"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { getTestCases } from "./actions"
import { Loader2, FileCode, TestTube } from "lucide-react"
import Link from "next/link"
import DeleteTestButton from "./delete-test-button"
import { Badge } from "@/components/ui/badge"

export default function SavedTests() {
  const { toast } = useToast()
  const [testCases, setTestCases] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTestCases()
  }, [])

  const fetchTestCases = async () => {
    setIsLoading(true)
    try {
      const result = await getTestCases()
      if (result.success) {
        setTestCases(result.data || [])
      } else {
        console.error("Failed to load test cases:", result.error)
        toast({
          title: "Error loading test cases",
          description: result.error || "Failed to load test cases",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching test cases:", error)
      toast({
        title: "Error",
        description: "Failed to fetch test cases. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading saved test cases...</p>
        </div>
      </div>
    )
  }

  if (testCases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Tests</CardTitle>
          <CardDescription>You haven't saved any tests yet</CardDescription>
        </CardHeader>
        <CardContent className="text-center p-12">
          <TestTube className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="mb-4">Generate and save some tests to see them here.</p>
          <Button asChild>
            <Link href="/testing">Generate Tests</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Saved Tests</CardTitle>
          <CardDescription>View and manage your saved test cases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {testCases.map((testCase) => {
              // Parse the generated_tests JSON if it's a string
              let parsedTests = {}
              try {
                if (typeof testCase.generated_tests === "string") {
                  parsedTests = JSON.parse(testCase.generated_tests)
                } else if (testCase.generated_tests && typeof testCase.generated_tests === "object") {
                  parsedTests = testCase.generated_tests
                }
              } catch (e) {
                console.error("Error parsing generated_tests:", e)
              }

              return (
                <Card key={testCase.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{testCase.name}</h3>
                        {testCase.uploaded_file_name && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <FileCode className="h-3 w-3" />
                            {testCase.uploaded_file_name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
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
                      <p className="text-sm text-muted-foreground mt-2">
                        Component: <span className="font-mono">{testCase.component_to_test}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(testCase.created_at).toLocaleString()}
                      </p>
                      {parsedTests.cases && (
                        <p className="text-sm text-muted-foreground">{parsedTests.cases.length} test cases</p>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4 md:mt-0">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/testing/${testCase.id}`} className="flex items-center gap-2">
                          <TestTube className="h-4 w-4" />
                          View Tests
                        </Link>
                      </Button>
                      <DeleteTestButton testId={testCase.id} onSuccess={fetchTestCases} />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
