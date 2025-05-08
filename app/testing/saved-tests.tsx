"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getTestCases } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { Eye, RefreshCw, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import DeleteTestButton from "./delete-test-button"

export default function SavedTests() {
  const { toast } = useToast()
  const [testCases, setTestCases] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [debugInfo, setDebugInfo] = useState(null)

  useEffect(() => {
    fetchTestCases()
  }, [])

  const fetchTestCases = async () => {
    setIsLoading(true)
    setError(null)
    setDebugInfo(null)

    try {
      console.log("Fetching test cases...")
      const result = await getTestCases()
      console.log("Fetch result:", result)

      if (result.success) {
        console.log(`Fetched ${result.data?.length || 0} test cases`)
        setTestCases(result.data || [])
        setDebugInfo({
          count: result.data?.length || 0,
          timestamp: new Date().toISOString(),
        })
      } else {
        console.error("Failed to load test cases:", result.error)
        setError(result.error || "Failed to load test cases")
        toast({
          title: "Error loading test cases",
          description: result.error || "Failed to load test cases",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching test cases:", error)
      setError(error.message || "An unexpected error occurred")
      toast({
        title: "Error",
        description: "Failed to fetch test cases. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchTestCases()
    setIsRefreshing(false)

    toast({
      title: "Data refreshed",
      description: "The test cases list has been refreshed.",
    })
  }

  const handleDeleteSuccess = () => {
    // Refresh the list after successful deletion
    fetchTestCases()
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Saved Test Cases</h2>
        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {debugInfo && (
        <div className="text-xs text-muted-foreground">
          Last updated: {debugInfo.timestamp} | Found: {debugInfo.count} test cases
        </div>
      )}

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Error loading test cases</h3>
                <p className="text-sm text-red-700">{error}</p>
                <Button variant="outline" size="sm" className="mt-2 bg-white hover:bg-red-50" onClick={handleRefresh}>
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading test cases...</p>
          </div>
        </div>
      ) : testCases.length === 0 && !error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <p className="text-muted-foreground mb-4">No test cases found</p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/testing">Create New Tests</Link>
              </Button>
              <Button variant="outline" onClick={handleRefresh}>
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testCases.map((testCase) => (
            <Card key={testCase.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{testCase.name || "Unnamed Test"}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/testing/${testCase.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <DeleteTestButton testId={testCase.id} onSuccess={handleDeleteSuccess} />
                  </div>
                </div>
                <CardDescription>
                  {testCase.created_at
                    ? `Created on ${format(new Date(testCase.created_at), "MMM d, yyyy")}`
                    : "Creation date unknown"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getTestTypeColor(testCase.test_type)}>
                      {testCase.test_type?.charAt(0).toUpperCase() + testCase.test_type?.slice(1) || "Unknown"} Tests
                    </Badge>
                    <Badge className={getFrameworkColor(testCase.framework)}>
                      {testCase.framework?.charAt(0).toUpperCase() + testCase.framework?.slice(1) || "Unknown"}
                    </Badge>
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">Component: </span>
                    <span className="font-mono">{testCase.component_to_test || "Not specified"}</span>
                  </div>

                  {testCase.specifications && (
                    <div className="text-sm">
                      <span className="font-medium">Specification: </span>
                      <span>{testCase.specifications.app_name || "Unknown"}</span>
                    </div>
                  )}

                  {testCase.designs && (
                    <div className="text-sm">
                      <span className="font-medium">Design: </span>
                      <span>
                        {testCase.designs.type?.charAt(0).toUpperCase() + testCase.designs.type?.slice(1) || "Unknown"}
                      </span>
                    </div>
                  )}

                  {testCase.code_generations && (
                    <div className="text-sm">
                      <span className="font-medium">Generated Code: </span>
                      <span>
                        {testCase.code_generations.language} - {testCase.code_generations.framework}
                      </span>
                    </div>
                  )}

                  <div className="mt-4">
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={`/testing/${testCase.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
