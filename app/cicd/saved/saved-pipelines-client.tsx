"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle, Box, FileCode, Github, Gitlab } from "lucide-react"
import DeleteButton from "./delete-button"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SavedPipelinesClient({ pipelines, needsSetup }) {
  const router = useRouter()

  // Function to get the appropriate icon based on pipeline type
  const getPlatformIcon = (platform) => {
    const type = (platform || "").toLowerCase()
    if (type.includes("github")) return <Github className="h-5 w-5 text-gray-700" />
    if (type.includes("gitlab")) return <Gitlab className="h-5 w-5 text-orange-600" />
    return <Box className="h-5 w-5 text-blue-600" />
  }

  if (needsSetup) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Database setup required</AlertTitle>
        <AlertDescription>
          The CI/CD pipeline tables need to be set up before you can use this feature.
          <div className="mt-2">
            <Button variant="outline" onClick={() => router.push("/cicd/setup-database")}>
              Setup Database
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (!pipelines || pipelines.length === 0) {
    return (
      <div className="text-center p-12 border border-dashed rounded-lg">
        <FileCode className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No pipelines found</h3>
        <p className="text-muted-foreground mb-4">You haven't created any CI/CD pipelines yet.</p>
        <Button onClick={() => router.push("/cicd")}>Create Pipeline</Button>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {pipelines.map((pipeline) => (
        <Card key={pipeline.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              {getPlatformIcon(pipeline.pipeline_type || pipeline.platform)}
              <div>
                <h3 className="font-medium">{pipeline.name || pipeline.project_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {(pipeline.pipeline_type || pipeline.platform || "CI/CD").charAt(0).toUpperCase() +
                    (pipeline.pipeline_type || pipeline.platform || "CI/CD").slice(1)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-sm text-muted-foreground">
              Created {new Date(pipeline.created_at).toLocaleDateString()}
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href={`/cicd/${pipeline.id}`}>View Details</Link>
            </Button>
            <DeleteButton id={pipeline.id} />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
