"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Github, Gitlab, Box, Code, FileCode, History, Terminal } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import DeletePipelineButton from "../pipelines-saved/delete-button"
import DownloadButton from "./download-button"
import { getPipelineById } from "../actions"

export default async function PipelineDetailPage({ params }: { params: { id: string } }) {
  const { data: pipeline, error, success } = await getPipelineById(params.id)

  if (error || !success || !pipeline) {
    notFound()
  }

  const getPlatformIcon = (platform) => {
    switch (platform?.toLowerCase()) {
      case "github":
        return <Github className="h-5 w-5 text-gray-700" />
      case "gitlab":
        return <Gitlab className="h-5 w-5 text-orange-600" />
      default:
        return <Box className="h-5 w-5 text-blue-600" />
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center mb-8">
        <Link href="/cicd/pipelines-saved">
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
          <DownloadButton pipeline={pipeline} />
          <DeletePipelineButton id={pipeline.id} />
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
                  <code>{pipeline.pipeline_code || "No pipeline code available"}</code>
                </pre>
                <div className="absolute top-2 right-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(pipeline.pipeline_code || "")
                    }}
                  >
                    Copy
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

                  {pipeline.design_id && (
                    <>
                      <dt className="font-medium">Design ID:</dt>
                      <dd>
                        <Link href={`/design/${pipeline.design_id}`} className="text-blue-600 hover:underline">
                          {pipeline.design_id}
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
                      {pipeline.pipeline_type?.toLowerCase() === "github" ||
                      pipeline.platform?.toLowerCase() === "github"
                        ? "Place the file in the .github/workflows directory in your repository."
                        : pipeline.pipeline_type?.toLowerCase() === "gitlab" ||
                            pipeline.platform?.toLowerCase() === "gitlab"
                          ? "Place the .gitlab-ci.yml file in the root of your repository."
                          : pipeline.pipeline_type?.toLowerCase() === "azure" ||
                              pipeline.platform?.toLowerCase() === "azure"
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
