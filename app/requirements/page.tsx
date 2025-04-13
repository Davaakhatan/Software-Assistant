import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import RequirementsForm from "./requirements-form"
import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"

export default function RequirementsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <Link href="/requirements-list">
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            View Saved Requirements
          </Button>
        </Link>
      </div>

      <div className="flex flex-col items-start mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Requirements Gathering</h1>
        <p className="text-muted-foreground">Define your project requirements and user stories to get started</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RequirementsForm />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tips for Good Requirements</CardTitle>
              <CardDescription>Follow these guidelines for effective requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Be Specific</h3>
                <p className="text-sm text-muted-foreground">
                  Avoid vague language and be precise about what you need.
                </p>
              </div>
              <div>
                <h3 className="font-medium">Use User Stories</h3>
                <p className="text-sm text-muted-foreground">
                  Format as: "As a [user], I want [feature] so that [benefit]"
                </p>
              </div>
              <div>
                <h3 className="font-medium">Include Acceptance Criteria</h3>
                <p className="text-sm text-muted-foreground">Define how you'll know when a requirement is met.</p>
              </div>
              <div>
                <h3 className="font-medium">Prioritize</h3>
                <p className="text-sm text-muted-foreground">
                  Label requirements as must-have, should-have, or nice-to-have.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>After completing requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Once you've defined your requirements, you can move on to system design or directly to code generation.
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/design">
                  <Button variant="outline" className="w-full justify-start">
                    System Design
                  </Button>
                </Link>
                <Link href="/code-generation">
                  <Button variant="outline" className="w-full justify-start">
                    Code Generation
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
