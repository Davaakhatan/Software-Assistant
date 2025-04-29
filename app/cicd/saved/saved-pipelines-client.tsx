"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Download, ExternalLink, GitBranch } from "lucide-react"
import DeletePipelineButton from "./delete-button"

export default function SavedPipelinesClient({ pipelines }) {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center mb-8">
        <Link href="/cicd">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to CI/CD
          </Button>
        </Link>
      </div>

      <div className="flex flex-col items-start mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Saved Pipelines</h1>
        <p className="text-muted-foreground">View and manage your saved CI/CD pipelines</p>
      </div>

      {pipelines.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">No pipelines saved yet</p>
            <Link href="/cicd">
              <Button>Create Pipeline</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pipelines.map((pipeline) => (
            <Card key={pipeline.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="truncate">{pipeline.name}</CardTitle>
                <CardDescription>
                  {pipeline.pipeline_type.charAt(0).toUpperCase() + pipeline.pipeline_type.slice(1)} Pipeline
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="text-sm text-muted-foreground mb-2">
                  Created: {new Date(pipeline.created_at).toLocaleDateString()}
                </div>
                <div className="bg-muted p-2 rounded-md h-24 overflow-hidden text-xs font-mono">
                  {pipeline.pipeline_code.slice(0, 200)}
                  {pipeline.pipeline_code.length > 200 && "..."}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href={`/cicd/${pipeline.id}`}>
                  <Button variant="outline" size="sm" className="gap-1">
                    <ExternalLink className="h-3.5 w-3.5" />
                    View
                  </Button>
                </Link>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => {
                      const blob = new Blob([pipeline.pipeline_code], { type: "text/plain" })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = `${pipeline.name.replace(/\s+/g, "-").toLowerCase()}.yml`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                  <DeletePipelineButton id={pipeline.id} />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
