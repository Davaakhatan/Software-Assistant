"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function SetupExecSqlFunction() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSetup = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/create-exec-sql-function", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
      } else {
        setError(data.error || "Failed to create exec_sql function")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Setup Required</CardTitle>
        <CardDescription>
          We need to create a helper function in your database to enable code generation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {success ? (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <div>Setup completed successfully! You can now use code generation.</div>
          </div>
        ) : (
          <Button onClick={handleSetup} disabled={isLoading} className="w-full">
            {isLoading ? "Setting up..." : "Set Up Database Function"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
