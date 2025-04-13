import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import DocumentationGenerator from "./documentation-generator"

export default function DocumentationPage() {
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
        <h1 className="text-3xl font-bold tracking-tight mb-2">Documentation</h1>
        <p className="text-muted-foreground">Generate comprehensive documentation for your project</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <DocumentationGenerator />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Documentation Tips</CardTitle>
              <CardDescription>Guidelines for effective documentation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Keep It Updated</h3>
                <p className="text-sm text-muted-foreground">Documentation should evolve with your code.</p>
              </div>
              <div>
                <h3 className="font-medium">Use Examples</h3>
                <p className="text-sm text-muted-foreground">Include code examples to illustrate usage.</p>
              </div>
              <div>
                <h3 className="font-medium">Consider Your Audience</h3>
                <p className="text-sm text-muted-foreground">
                  Tailor documentation to different user types (developers, end-users).
                </p>
              </div>
              <div>
                <h3 className="font-medium">Include Visuals</h3>
                <p className="text-sm text-muted-foreground">Diagrams and screenshots can clarify complex concepts.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentation Types</CardTitle>
              <CardDescription>Different types of documentation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">API Documentation</h3>
                <p className="text-sm text-muted-foreground">Describes endpoints, parameters, and responses.</p>
              </div>
              <div>
                <h3 className="font-medium">User Guides</h3>
                <p className="text-sm text-muted-foreground">Step-by-step instructions for end users.</p>
              </div>
              <div>
                <h3 className="font-medium">Technical Documentation</h3>
                <p className="text-sm text-muted-foreground">
                  Detailed information for developers and technical staff.
                </p>
              </div>
              <div>
                <h3 className="font-medium">Architecture Documentation</h3>
                <p className="text-sm text-muted-foreground">Describes system components and their interactions.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
