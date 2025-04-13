import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import CICDPipelineBuilder from "./cicd-pipeline-builder"

export default function CICDPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center mb-8">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex flex-col items-start mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">CI/CD Pipeline</h1>
        <p className="text-muted-foreground">Configure continuous integration and deployment pipelines</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CICDPipelineBuilder />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CI/CD Best Practices</CardTitle>
              <CardDescription>Guidelines for effective pipelines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Automate Everything</h3>
                <p className="text-sm text-muted-foreground">Minimize manual steps in your deployment process.</p>
              </div>
              <div>
                <h3 className="font-medium">Fast Feedback</h3>
                <p className="text-sm text-muted-foreground">
                  Ensure your pipeline provides quick feedback on failures.
                </p>
              </div>
              <div>
                <h3 className="font-medium">Parallel Execution</h3>
                <p className="text-sm text-muted-foreground">
                  Run independent steps in parallel to speed up the pipeline.
                </p>
              </div>
              <div>
                <h3 className="font-medium">Environment Parity</h3>
                <p className="text-sm text-muted-foreground">
                  Keep development, staging, and production environments similar.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>After setting up CI/CD</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Once you've set up your CI/CD pipeline, you can generate documentation or review your entire SDLC
                process.
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/documentation">
                  <Button variant="outline" className="w-full justify-start">
                    Documentation
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full justify-start">
                    Review Full SDLC
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
