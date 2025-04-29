import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseServer } from "@/lib/supabase-server"
import { ArrowLeft, Github, Gitlab, Box } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import DeletePipelineButton from "../pipelines-saved/delete-button"
import DownloadButton from "./download-button"

export default async function PipelineDetailPage({ params }: { params: { id: string } }) {
  const supabase = getSupabaseServer()
  const { data: pipeline, error } = await supabase.from("ci_cd_pipelines").select("*").eq("id", params.id).single()

  if (error || !pipeline) {
    notFound()
  }

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
        <Link href="/cicd/pipelines-saved">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Saved Pipelines
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          {getPlatformIcon(pipeline.platform)}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{pipeline.project_name || pipeline.name}</h1>
            <p className="text-muted-foreground">{pipeline.platform || "Generic"} Pipeline</p>
          </div>
        </div>
        <div className="flex gap-2">
          <DownloadButton pipeline={pipeline} />
          <DeletePipelineButton id={pipeline.id} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Details</CardTitle>
            <CardDescription>Configuration and metadata</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-3 text-sm">
              <dt className="font-medium">Pipeline Type:</dt>
              <dd>{pipeline.pipeline_type || "CI/CD"}</dd>

              <dt className="font-medium">Platform:</dt>
              <dd>{pipeline.platform || "Generic"}</dd>

              <dt className="font-medium">Project:</dt>
              <dd>{pipeline.project_name || pipeline.name}</dd>

              <dt className="font-medium">Created:</dt>
              <dd>{new Date(pipeline.created_at).toLocaleString()}</dd>

              <dt className="font-medium">Last Updated:</dt>
              <dd>{new Date(pipeline.updated_at).toLocaleString()}</dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline Code</CardTitle>
            <CardDescription>Configuration file</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[400px] text-sm">
              <code>{pipeline.pipeline_code || "No pipeline code available"}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
