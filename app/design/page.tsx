import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"
import SystemArchitecture from "./system-architecture"
import DataModel from "./data-model"
import ComponentDiagram from "./component-diagram"

export default function DesignPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <Link href="/design-list">
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            View Saved Designs
          </Button>
        </Link>
      </div>

      <div className="flex flex-col items-start mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">System Design</h1>
        <p className="text-muted-foreground">
          Design your system architecture, data models, and component interactions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="architecture" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="architecture">Architecture</TabsTrigger>
              <TabsTrigger value="data-model">Data Model</TabsTrigger>
              <TabsTrigger value="components">Components</TabsTrigger>
            </TabsList>
            <TabsContent value="architecture" className="mt-6">
              <SystemArchitecture />
            </TabsContent>
            <TabsContent value="data-model" className="mt-6">
              <DataModel />
            </TabsContent>
            <TabsContent value="components" className="mt-6">
              <ComponentDiagram />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Design Principles</CardTitle>
              <CardDescription>Follow these guidelines for effective system design</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Separation of Concerns</h3>
                <p className="text-sm text-muted-foreground">
                  Divide your system into distinct sections with minimal overlap.
                </p>
              </div>
              <div>
                <h3 className="font-medium">Single Responsibility</h3>
                <p className="text-sm text-muted-foreground">Each component should have one reason to change.</p>
              </div>
              <div>
                <h3 className="font-medium">Don't Repeat Yourself (DRY)</h3>
                <p className="text-sm text-muted-foreground">Avoid duplication by abstracting common functionality.</p>
              </div>
              <div>
                <h3 className="font-medium">KISS (Keep It Simple, Stupid)</h3>
                <p className="text-sm text-muted-foreground">
                  Simpler designs are easier to implement, test, and maintain.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>After completing system design</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Once you've designed your system, you can move on to code generation or test planning.
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/code-generation">
                  <Button variant="outline" className="w-full justify-start">
                    Code Generation
                  </Button>
                </Link>
                <Link href="/testing">
                  <Button variant="outline" className="w-full justify-start">
                    Test Planning
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
