import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TestCaseGenerator from "./test-case-generator"
import SavedTests from "./saved-tests"
import { Database, Sparkles } from "lucide-react"
import NextLink from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Testing",
  description: "Generate and manage test cases for your application",
}

export const dynamic = "force-dynamic"
export const revalidate = 0

export default function TestingPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Testing
            <Sparkles className="h-5 w-5 text-yellow-500" />
          </h1>
          <p className="text-muted-foreground">
            Generate and manage test cases for your application components with AI assistance
          </p>
        </div>
        <Button variant="outline" asChild>
          <NextLink href="/testing/setup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database Setup
          </NextLink>
        </Button>
      </div>

      <Tabs defaultValue="generator" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generator">Test Generator</TabsTrigger>
          <TabsTrigger value="saved">Saved Tests</TabsTrigger>
        </TabsList>
        <TabsContent value="generator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                AI-Powered Test Generator
                <Sparkles className="h-5 w-5 text-yellow-500" />
              </CardTitle>
              <CardDescription>
                Generate comprehensive test cases for your components using AI or predefined templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TestCaseGenerator />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="saved" className="space-y-4">
          <SavedTests />
        </TabsContent>
      </Tabs>
    </div>
  )
}
