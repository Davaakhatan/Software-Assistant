import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GitBranch, GitPullRequest, Workflow, Code, History } from "lucide-react"
import { CICDPipelineBuilder } from "./cicd-pipeline-builder"
import { getPipelines } from "./actions"
import { PipelineVisualizer } from "./pipeline-visualizer"

export const metadata: Metadata = {
  title: "CI/CD Pipeline Generator",
  description: "Generate and manage CI/CD pipelines for your projects",
}

export default async function CICDPage() {
  const { data: pipelines, success } = await getPipelines()
  const recentPipelines = success && pipelines ? pipelines.slice(0, 3) : []

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CI/CD Pipeline Generator</h1>
          <p className="text-muted-foreground mt-1">
            Create, visualize, and manage continuous integration and deployment pipelines
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/cicd/pipelines-saved">
            <Button variant="outline" className="gap-2">
              <History className="h-4 w-4" />
              View Saved Pipelines
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="generator" className="space-y-8">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
          <TabsTrigger value="generator" className="gap-2">
            <Code className="h-4 w-4" />
            Generator
          </TabsTrigger>
          <TabsTrigger value="visualizer" className="gap-2">
            <Workflow className="h-4 w-4" />
            Visualizer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <CICDPipelineBuilder />
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5 text-blue-500" />
                    CI/CD Best Practices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                        <GitPullRequest className="h-3 w-3 text-blue-600" />
                      </div>
                      <span>Use branch protection rules to enforce code reviews</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                        <GitPullRequest className="h-3 w-3 text-blue-600" />
                      </div>
                      <span>Implement comprehensive automated testing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                        <GitPullRequest className="h-3 w-3 text-blue-600" />
                      </div>
                      <span>Use environment-specific configurations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                        <GitPullRequest className="h-3 w-3 text-blue-600" />
                      </div>
                      <span>Implement security scanning in your pipeline</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                        <GitPullRequest className="h-3 w-3 text-blue-600" />
                      </div>
                      <span>Use caching to speed up builds</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {recentPipelines.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5 text-purple-500" />
                      Recent Pipelines
                    </CardTitle>
                    <CardDescription>Your recently created pipelines</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {recentPipelines.map((pipeline) => (
                        <li key={pipeline.id}>
                          <Link href={`/cicd/${pipeline.id}`} className="block">
                            <div className="rounded-md border p-3 hover:bg-muted transition-colors">
                              <div className="font-medium">{pipeline.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(pipeline.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link href="/cicd/pipelines-saved" className="w-full">
                      <Button variant="outline" className="w-full gap-2">
                        <History className="h-4 w-4" />
                        View All Pipelines
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="visualizer">
          <PipelineVisualizer />
        </TabsContent>
      </Tabs>
    </div>
  )
}
