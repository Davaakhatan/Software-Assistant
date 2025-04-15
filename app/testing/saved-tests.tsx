"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Eye, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getTestCases } from "./actions"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

export default function SavedTests() {
  const { toast } = useToast()
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true)
        const result = await getTestCases()
        if (result.success) {
          setTests(result.data || [])
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to load saved tests",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching tests:", error)
        toast({
          title: "Error",
          description: "Failed to load saved tests",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTests()
  }, [toast])

  const handleDownload = (test) => {
    try {
      // Parse the generated_tests JSON if it's a string
      let testData
      if (typeof test.generated_tests === "string") {
        try {
          testData = JSON.parse(test.generated_tests)
        } catch (e) {
          testData = { generatedCode: test.generated_tests }
        }
      } else {
        testData = test.generated_tests
      }

      const codeToDownload = testData.generatedCode || testData

      // Create a blob and download it
      const blob = new Blob([codeToDownload], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${test.name || "test"}.${test.framework === "jest" ? "test.js" : test.framework === "vitest" ? "spec.js" : "js"}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Test downloaded",
        description: "Your test has been downloaded successfully.",
      })
    } catch (error) {
      console.error("Error downloading test:", error)
      toast({
        title: "Error",
        description: "Failed to download test",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id) => {
    // This would be implemented with a deleteTestCase server action
    toast({
      title: "Not implemented",
      description: "Delete functionality will be implemented in a future update.",
    })
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

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-full" />
            </CardContent>
            <CardFooter>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (tests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12">
          <p className="text-muted-foreground mb-4">No saved tests found.</p>
          <p className="text-sm text-muted-foreground">
            Generate and save tests from the Test Generator tab to see them here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {tests.map((test) => (
        <Card key={test.id}>
          <CardHeader>
            <CardTitle>{test.name || "Unnamed Test"}</CardTitle>
            <CardDescription>
              {test.created_at
                ? `Created on ${format(new Date(test.created_at), "MMM d, yyyy 'at' h:mm a")}`
                : "Creation date unknown"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className={getTestTypeColor(test.test_type)}>
                {test.test_type?.charAt(0).toUpperCase() + test.test_type?.slice(1) || "Unknown"} Tests
              </Badge>
              <Badge className={getFrameworkColor(test.framework)}>
                {test.framework?.charAt(0).toUpperCase() + test.framework?.slice(1) || "Unknown"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Component:{" "}
              <span className="font-mono">{test.component_to_test || test.component || "Not specified"}</span>
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(test)}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button variant="outline" size="sm" asChild className="flex items-center gap-1">
                <Link href={`/testing/${test.id}`}>
                  <Eye className="h-4 w-4" />
                  View
                </Link>
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(test.id)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
