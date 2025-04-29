"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Download } from "lucide-react"

export default function PipelineDetailClient({ pipeline }) {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center mb-8">
        <Link href="/cicd/saved">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Saved Pipelines
          </Button>
        </Link>
      </div>

      <div className="flex flex-col items-start mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{pipeline.name}</h1>
        <p className="text-muted-foreground">
          {pipeline.pipeline_type.charAt(0).toUpperCase() + pipeline.pipeline_type.slice(1)} Pipeline
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Configuration</CardTitle>
              <CardDescription>Created on {new Date(pipeline.created_at).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-md overflow-auto text-sm font-mono h-[500px]">
                {pipeline.pipeline_code}
              </pre>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
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
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Pipeline
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Details</CardTitle>
              <CardDescription>Information about this pipeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Pipeline Type</h3>
                <p className="text-sm text-muted-foreground">
                  {pipeline.pipeline_type.charAt(0).toUpperCase() + pipeline.pipeline_type.slice(1)}
                </p>
              </div>
              <div>
                <h3 className="font-medium">Created</h3>
                <p className="text-sm text-muted-foreground">{new Date(pipeline.created_at).toLocaleString()}</p>
              </div>
              {pipeline.metadata && (
                <>
                  {pipeline.metadata.generatedWith && (
                    <div>
                      <h3 className="font-medium">Generated With</h3>
                      <p className="text-sm text-muted-foreground">{pipeline.metadata.generatedWith}</p>
                    </div>
                  )}
                  {pipeline.metadata.temperature && (
                    <div>
                      <h3 className="font-medium">Temperature</h3>
                      <p className="text-sm text-muted-foreground">{pipeline.metadata.temperature}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>What to do with this pipeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This pipeline can be integrated into your version control system to automate your build, test, and
                deployment processes.
              </p>
              <div className="space-y-2">
                <h3 className="font-medium">Integration Steps</h3>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                  <li>Download the pipeline configuration file</li>
                  <li>Add it to your repository in the appropriate location</li>
                  <li>Configure any necessary secrets or environment variables</li>
                  <li>Push changes to trigger the pipeline</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
