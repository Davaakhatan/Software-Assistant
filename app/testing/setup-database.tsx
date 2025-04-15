"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Database } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SetupTestCasesDatabase() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
    columns?: Array<{ column_name: string; data_type: string; is_nullable: string }>
  } | null>(null)

  const setupDatabase = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/testing/setup-database", {
        method: "POST",
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("Error setting up database:", error)
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "An unknown error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Testing Database Setup
        </CardTitle>
        <CardDescription>
          Set up the database tables required for the testing module. This will create the necessary tables and columns
          if they don't exist.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result && (
          <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}

        {result?.columns && result.columns.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Current Table Schema:</h3>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">Column Name</th>
                    <th className="px-4 py-2 text-left">Data Type</th>
                    <th className="px-4 py-2 text-left">Nullable</th>
                  </tr>
                </thead>
                <tbody>
                  {result.columns.map((column, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-muted/30"}>
                      <td className="px-4 py-2 border-t">{column.column_name}</td>
                      <td className="px-4 py-2 border-t">{column.data_type}</td>
                      <td className="px-4 py-2 border-t">{column.is_nullable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={setupDatabase} disabled={isLoading}>
          {isLoading ? "Setting Up..." : "Setup Database"}
        </Button>
      </CardFooter>
    </Card>
  )
}
