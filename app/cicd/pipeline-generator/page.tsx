import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { CICDPipelineBuilder } from "../cicd-pipeline-builder"

export default function PipelineGeneratorPage() {
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
        <h1 className="text-3xl font-bold tracking-tight mb-2">Pipeline Generator</h1>
        <p className="text-muted-foreground">Create a new CI/CD pipeline for your project</p>
      </div>

      <CICDPipelineBuilder />
    </div>
  )
}
