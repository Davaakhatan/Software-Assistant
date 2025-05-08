"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Download, Github, Gitlab, Box, Code, FileCode, History, Terminal } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

export default function PipelineDetailClient({ pipeline }) {
  const { toast } = useToast()
  const [copying, setCopying] = useState(false)

  const getPlatformIcon = (platform) => {
    const type = (platform || "").toLowerCase()
    if (type.includes("github")) return <Github className="h-5 w-5 text-gray-700" />
    if (type.includes("gitlab")) return <Gitlab className="h-5 w-5 text-orange-600" />
    return <Box className="h-5 w-5 text-blue-600" />
  }

  const handleDownload = () => {
    try {
      const blob = new Blob([pipeline.pipeline_code || pipeline.generated_config || ""], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${(pipeline.name || pipeline.project_name || "pipeline").replace(/\s+/g, "-").toLowerCase()}.yml`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Pipeline downloaded",
        description: "The pipeline configuration has been downloaded successfully.",
      })
    } catch (error) {
      console.error("Error downloading pipeline:", error)
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "There was an error downloading the pipeline configuration.",
      })
    }
  }

  const handleCopyCode = async () => {
    try {
      setCopying(true)
      await navigator.clipboard.writeText(pipeline.pipeline_code || pipeline.generated_config || "")
      toast({
        title: "Copied to clipboard",
        description: "Pipeline code copied to clipboard successfully.",
      })
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Failed to copy pipeline code to clipboard.",
      })
    } finally {
      setCopying(false)
    }
  }

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

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          {getPlatformIcon(pipeline.pipeline_type || pipeline.platform)}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{pipeline.name || pipeline.project_name}</h1>
            <p className="text-muted-foreground">
              {(pipeline.pipeline_type || pipeline.platform || "Generic").charAt(0).toUpperCase() +
                (pipeline.pipeline_type || pipeline.platform || "Generic").slice(1)}{" "}
              Pipeline
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      <Tabs defaultValue="code" className="space-y-6">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="code" className="gap-2">
            <Code className="h-4 w-4" />
            Pipeline Code
          </TabsTrigger>
          <TabsTrigger value="details" className="gap-2">
            <FileCode className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="code">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Configuration</CardTitle>
              <CardDescription>The complete pipeline code</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-slate-50 p-4 rounded-md overflow-auto max-h-[500px] text-sm font-mono border">
                  <code>{pipeline.pipeline_code || pipeline.generated_config || "No pipeline code available"}</code>
                </pre>
                <div className="absolute top-2 right-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={handleCopyCode}
                    disabled={copying}
                  >
                    {copying ? "Copying..." : "Copy"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Details</CardTitle>
                <CardDescription>Configuration and metadata</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-[1fr_2fr] gap-3 text-sm">
                  <dt className="font-medium">Pipeline Type:</dt>
                  <dd>{pipeline.pipeline_type || pipeline.platform || "CI/CD"}</dd>

                  <dt className="font-medium">Platform:</dt>
                  <dd>{pipeline.platform || pipeline.pipeline_type || "Generic"}</dd>

                  <dt className="font-medium">Project:</dt>
                  <dd>{pipeline.project_name || pipeline.name}</dd>

                  <dt className="font-medium">Created:</dt>
                  <dd>{new Date(pipeline.created_at).toLocaleString()}</dd>

                  <dt className="font-medium">Last Updated:</dt>
                  <dd>{new Date(pipeline.updated_at || pipeline.created_at).toLocaleString()}</dd>

                  {pipeline.specification_id && (
                    <>
                      <dt className="font-medium">Specification ID:</dt>
                      <dd>
                        <Link
                          href={`/specifications/${pipeline.specification_id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {pipeline.specification_id}
                        </Link>
                      </dd>
                    </>
                  )}

                  {(pipeline.design_id || pipeline.designid) && (
                    <>
                      <dt className="font-medium">Design ID:</dt>
                      <dd>
                        <Link
                          href={`/design/${pipeline.design_id || pipeline.designid}`}
                          className="text-blue-600 hover:underline"
                        >
                          {pipeline.design_id || pipeline.designid}
                        </Link>
                      </dd>
                    </>
                  )}
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Integration Guide</CardTitle>
                <CardDescription>How to use this pipeline</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">Follow these steps to integrate this CI/CD pipeline into your project:</p>

                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-md border">
                    <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Terminal className="h-4 w-4" />
                      Step 1: Download the pipeline file
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Use the download button at the top of this page to get the pipeline configuration file.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-md border">
                    <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Terminal className="h-4 w-4" />
                      Step 2: Add to your repository
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {(pipeline.pipeline_type || pipeline.platform || "").toLowerCase().includes("github")
                        ? "Place the file in the .github/workflows directory in your repository."
                        : (pipeline.pipeline_type || pipeline.platform || "").toLowerCase().includes("gitlab")
                          ? "Place the .gitlab-ci.yml file in the root of your repository."
                          : (pipeline.pipeline_type || pipeline.platform || "").toLowerCase().includes("azure")
                            ? "Place the azure-pipelines.yml file in the root of your repository."
                            : "Place the pipeline configuration file in the appropriate location for your CI/CD system."}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-md border">
                    <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Terminal className="h-4 w-4" />
                      Step 3: Configure secrets
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Add any required secrets or environment variables to your CI/CD platform.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-md border">
                    <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Terminal className="h-4 w-4" />
                      Step 4: Commit and push
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Commit the changes and push to your repository to trigger the pipeline.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline History</CardTitle>
              <CardDescription>Recent pipeline runs and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-6 text-center">
                <div>
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Pipeline history is not available in this preview</p>
                  <p className="text-xs text-muted-foreground">
                    In a production environment, this would show the history of pipeline runs and changes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
