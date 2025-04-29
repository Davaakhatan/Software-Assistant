import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { GitBranch, GitCommit, GitMerge, GitPullRequest } from "lucide-react"

export default function CICDPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-start mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">CI/CD Pipeline Generator</h1>
        <p className="text-muted-foreground">
          Create and manage continuous integration and deployment pipelines for your projects
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Pipeline Builder
            </CardTitle>
            <CardDescription>Create a new CI/CD pipeline for your project</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Generate CI/CD pipelines for GitHub, GitLab, Azure DevOps, and more. Configure build, test, and deployment
              stages.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/cicd/pipeline-generator">
              <Button>Create Pipeline</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCommit className="h-5 w-5" />
              Saved Pipelines
            </CardTitle>
            <CardDescription>View and manage your saved pipelines</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Access your previously created CI/CD pipelines, make updates, and download configuration files.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/cicd/pipelines-saved">
              <Button variant="outline">View Saved Pipelines</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitPullRequest className="h-5 w-5" />
              Pipeline Templates
            </CardTitle>
            <CardDescription>Use pre-configured pipeline templates</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Choose from a variety of templates for common project types and frameworks.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" disabled>
              Coming Soon
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitMerge className="h-5 w-5" />
              Pipeline Execution
            </CardTitle>
            <CardDescription>Monitor and manage pipeline executions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track the status of your pipeline runs, view logs, and troubleshoot issues.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" disabled>
              Coming Soon
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
