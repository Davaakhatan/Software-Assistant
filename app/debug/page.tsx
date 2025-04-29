"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function DebugPage() {
  const [tableData, setTableData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTableData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/debug/tables")
      const data = await response.json()

      if (response.ok) {
        setTableData(data)
      } else {
        setError(data.error || "Failed to fetch table data")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTableData()
  }, [])

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <Button variant="outline" onClick={fetchTableData} disabled={isLoading} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col items-start mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Database Debug</h1>
        <p className="text-muted-foreground">View database table information</p>
      </div>

      {error && (
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : tableData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(tableData.tables || {}).map(([tableName, tableInfo]: [string, any]) => (
            <Card key={tableName}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{tableName}</span>
                  <span className="text-sm font-normal bg-primary/10 px-2 py-1 rounded">
                    {tableInfo.count !== undefined ? tableInfo.count : "?"} rows
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tableInfo.error ? (
                  <p className="text-red-500">Error: {tableInfo.error}</p>
                ) : tableInfo.sample ? (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Sample Row:</h4>
                    <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-[200px]">
                      {JSON.stringify(tableInfo.sample, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  )
}
