"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function DesignsDebugPage() {
  const [designs, setDesigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDesigns = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch designs from our debug API
      const response = await fetch("/api/designs/debug", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`)
      }

      const data = await response.json()
      console.log("Debug page received data:", data)

      setDesigns(data.designs || [])
    } catch (err) {
      console.error("Error fetching designs in debug page:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDesigns()
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
        <Button onClick={fetchDesigns} disabled={loading}>
          {loading ? "Loading..." : "Refresh Designs"}
        </Button>
      </div>

      <div className="flex flex-col items-start mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Designs Debug Page</h1>
        <p className="text-muted-foreground">This page helps diagnose issues with designs fetching</p>
      </div>

      {error && (
        <Card className="mb-8 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Designs Count: {designs.length}</CardTitle>
          <CardDescription>This shows all designs in the database without any filtering</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading designs...</p>
          ) : designs.length > 0 ? (
            <div className="space-y-4">
              {designs.map((design) => (
                <Card key={design.id}>
                  <CardHeader>
                    <CardTitle>{design.project_name || "Unknown Project"}</CardTitle>
                    <CardDescription>Type: {design.type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="font-semibold">ID:</p>
                        <p className="text-sm font-mono">{design.id}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Requirement ID:</p>
                        <p className="text-sm font-mono">{design.requirement_id || "None"}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Created:</p>
                        <p className="text-sm">{new Date(design.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Link href={`/design/${design.id}`}>
                      <Button variant="outline">View Details</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p>No designs found in the database.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
