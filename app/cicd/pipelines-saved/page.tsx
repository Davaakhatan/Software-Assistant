import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, GitBranch, Github, Gitlab, Box } from "lucide-react"
import { getSupabaseServer } from "@/lib/supabase-server"
import { formatDistanceToNow } from "date-fns"
import DeletePipelineButton from "./delete-button"

export default async function SavedPipelinesPage() {
  const supabase = getSupabaseServer()
  const { data: pipelines, error } = await supabase
    .from("ci_cd_pipelines")
    .select("*")
    .order("created_at", { ascending: false })

  const getPlatformIcon = (platform) => {
    switch (platform?.toLowerCase()) {
      case "github":
        return <Github className="h-5 w-5" />
      case "gitlab":
        return <Gitlab className="h-5 w-5" />
      default:
        return <Box className="h-5 w-5" />
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

      <div className="flex flex-col items-start mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Saved Pipelines</h1>
        <p className="text-muted-foreground">View and manage your saved CI/CD pipelines</p>
      </div>

      {error && (
        <Card className="mb-8 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Error loading pipelines: {error.message}</p>
          </CardContent>
        </Card>
      )}

      {!error && pipelines && pipelines.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pipelines.map((pipeline) => (
            <Card key={pipeline.id}>
              <CardHeader className="flex flex-row items-center gap-2">
                {getPlatformIcon(pipeline.platform)}
                <div>
                  <CardTitle className="text-xl">{pipeline.project_name || pipeline.name}</CardTitle>
                  <CardDescription>
                    {pipeline.platform || "Generic"} • Created{" "}
                    {formatDistanceToNow(new Date(pipeline.created_at), { addSuffix: true })}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {pipeline.pipeline_type || "CI/CD Pipeline"}
                </p>
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
              {!error && pipelines && pipelines.length === 0 ? "No pipelines saved yet" : "Failed to load pipelines"}
            </p>
            <Link href="/cicd">
              <Button>Create Pipeline</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
