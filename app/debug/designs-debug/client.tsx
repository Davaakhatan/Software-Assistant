"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function DesignsDebugClient() {
  const [specificationId, setSpecificationId] = useState("")
  const [debugData, setDebugData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("tables")

  const fetchDebugData = async () => {
    setIsLoading(true)
    try {
      const url = specificationId ? `/api/debug/designs?specificationId=${specificationId}` : "/api/debug/designs"

      const response = await fetch(url)
      const data = await response.json()
      setDebugData(data)
      setActiveTab(specificationId ? "relationships" : "tables")
    } catch (error) {
      console.error("Error fetching debug data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug Options</CardTitle>
          <CardDescription>Enter a specification ID to check its relationships</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Specification ID (optional)"
              value={specificationId}
              onChange={(e) => setSpecificationId(e.target.value)}
              className="flex-1"
            />
            <Button onClick={fetchDebugData} disabled={isLoading}>
              {isLoading ? "Loading..." : "Fetch Debug Data"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {debugData && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Results</CardTitle>
            <CardDescription>Data fetched at: {debugData.timestamp}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="tables">Tables</TabsTrigger>
                <TabsTrigger value="relationships">Relationships</TabsTrigger>
                <TabsTrigger value="raw">Raw Data</TabsTrigger>
              </TabsList>

              <TabsContent value="tables">
                <div className="space-y-6">
                  <TableDebugSection title="Specifications" data={debugData.tables.specifications} />
                  <TableDebugSection title="Requirements" data={debugData.tables.requirements} />
                  <TableDebugSection title="Designs" data={debugData.tables.designs} />
                </div>
              </TabsContent>

              <TabsContent value="relationships">
                <div className="space-y-6">
                  {debugData.relationships.specificationRequirements && (
                    <RelationshipDebugSection
                      title="Specification to Requirements"
                      data={debugData.relationships.specificationRequirements}
                    />
                  )}

                  {debugData.relationships.requirementDesigns && (
                    <RelationshipDebugSection
                      title="Requirements to Designs"
                      data={debugData.relationships.requirementDesigns}
                    />
                  )}

                  {!debugData.relationships.specificationRequirements && (
                    <div className="text-center p-6 text-muted-foreground">
                      No relationship data available. Try specifying a specification ID.
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="raw">
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[500px]">
                  {JSON.stringify(debugData, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function TableDebugSection({ title, data }) {
  if (!data) return null

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <div className="bg-muted p-4 rounded-md">
        <div className="flex justify-between mb-2">
          <span>Count: {data.count}</span>
          {data.error && <span className="text-destructive">Error: {data.error}</span>}
        </div>

        {data.sample && data.sample.length > 0 ? (
          <div className="overflow-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {Object.keys(data.sample[0]).map((key) => (
                    <th key={key} className="text-left p-2">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.sample.map((item, i) => (
                  <tr key={i} className="border-t border-border">
                    {Object.values(item).map((value, j) => (
                      <td key={j} className="p-2">
                        {value === null ? "null" : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground">No data available</p>
        )}
      </div>
    </div>
  )
}

function RelationshipDebugSection({ title, data }) {
  if (!data) return null

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <div className="bg-muted p-4 rounded-md">
        <div className="flex justify-between mb-2">
          <span>Count: {data.count}</span>
          {data.error && <span className="text-destructive">Error: {data.error}</span>}
        </div>

        {title === "Specification to Requirements" && (
          <>
            <p className="mb-2">Specification ID: {data.specificationId}</p>
            {data.requirements && data.requirements.length > 0 ? (
              <div className="overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {Object.keys(data.requirements[0]).map((key) => (
                        <th key={key} className="text-left p-2">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.requirements.map((item, i) => (
                      <tr key={i} className="border-t border-border">
                        {Object.values(item).map((value, j) => (
                          <td key={j} className="p-2">
                            {value === null ? "null" : String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground">No requirements found for this specification</p>
            )}
          </>
        )}

        {title === "Requirements to Designs" && (
          <>
            <p className="mb-2">Requirement IDs: {data.requirementIds.join(", ")}</p>
            {data.designs && data.designs.length > 0 ? (
              <div className="overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {Object.keys(data.designs[0]).map((key) => (
                        <th key={key} className="text-left p-2">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.designs.map((item, i) => (
                      <tr key={i} className="border-t border-border">
                        {Object.values(item).map((value, j) => (
                          <td key={j} className="p-2">
                            {value === null ? "null" : String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground">No designs found for these requirements</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
