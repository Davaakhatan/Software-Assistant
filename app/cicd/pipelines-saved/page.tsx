import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, GitBranch, Github, Gitlab, Box, Plus } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import DeletePipelineButton from "./delete-button"
import { getPipelines } from "../actions"

export default async function SavedPipelinesPage() {
  const { data: pipelines, error, success } = await getPipelines()

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
        <Link href="/cicd">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to CI/CD
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Saved Pipelines</h1>
          <p className="text-muted-foreground">View and manage your saved CI/CD pipelines</p>
        </div>
        <Link href="/cicd">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Pipeline
          </Button>
        </Link>
      </div>

      {error && (
        <Card className="mb-8 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Error loading pipelines: {error}</p>
          </CardContent>
        </Card>
      )}

      {!error && success && pipelines && pipelines.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pipelines.map((pipeline) => (
            <Card key={pipeline.id} className="group hover:shadow-md transition-all duration-200 border-blue-100">
              <CardHeader className="flex flex-row items-center gap-2 bg-gradient-to-r from-blue-50 to-slate-50 border-b border-blue-100">
                {getPlatformIcon(pipeline.pipeline_type || pipeline.platform)}
                <div>
                  <CardTitle className="text-xl">{pipeline.name || pipeline.project_name}</CardTitle>
                  <CardDescription>
                    {(pipeline.pipeline_type || pipeline.platform || "Generic").charAt(0).toUpperCase() +
                      (pipeline.pipeline_type || pipeline.platform || "Generic").slice(1)}{" "}
                    • Created {formatDistanceToNow(new Date(pipeline.created_at), { addSuffix: true })}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="bg-slate-50 p-3 rounded-md border border-slate-100 font-mono text-xs overflow-hidden h-24">
                  {pipeline.pipeline_code
                    ? pipeline.pipeline_code.slice(0, 150) + (pipeline.pipeline_code.length > 150 ? "..." : "")
                    : "No pipeline code available"}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href={`/cicd/${pipeline.id}`}>
                  <Button variant="outline">View Details</Button>
                </Link>
                <DeletePipelineButton id={pipeline.id} />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              {!error && success && (!pipelines || pipelines.length === 0)
                ? "No pipelines saved yet"
                : "Failed to load pipelines"}
            </p>
            <Link href="/cicd">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Pipeline
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
