import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText } from "lucide-react"
import { SpecificationGenerator } from "./specification-generator"

export default function SpecificationGeneratorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <Link href="/specifications-list">
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            View Saved Specifications
          </Button>
        </Link>
      </div>

      <div className="flex flex-col items-start mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-1">App Specification Generator</h1>
        <p className="text-muted-foreground">Generate comprehensive specifications for your application</p>
      </div>

      <SpecificationGenerator />
    </div>
  )
}
