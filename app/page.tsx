import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, FileText, Code, TestTube, GitBranch, FileCode } from "lucide-react"
import { AISettings } from "@/components/ai-settings"

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center text-center mb-12">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-4xl font-bold tracking-tight">AI-Powered SDLC Companion</h1>
          <Sparkles className="h-8 w-8 text-blue-500" />
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Streamline your software development lifecycle with AI-generated specifications, designs, code, tests, and
          documentation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Specification Generator</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="min-h-[60px]">
              Generate comprehensive specifications for your application using AI.
            </CardDescription>
            <div className="mt-4">
              <Link href="/specification-generator">
                <Button className="w-full flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate Specifications
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">System Design</CardTitle>
            <FileCode className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="min-h-[60px]">
              Create system architecture, data models, and component diagrams with AI assistance.
            </CardDescription>
            <div className="mt-4">
              <Link href="/design">
                <Button className="w-full flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Design System
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Code Generation</CardTitle>
            <Code className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="min-h-[60px]">
              Generate code in multiple languages and frameworks based on your specifications.
            </CardDescription>
            <div className="mt-4">
              <Link href="/code-generation">
                <Button className="w-full flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate Code
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Test Automation</CardTitle>
            <TestTube className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="min-h-[60px]">
              Create test cases and test scripts automatically with AI.
            </CardDescription>
            <div className="mt-4">
              <Link href="/testing">
                <Button className="w-full flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate Tests
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">CI/CD Pipeline</CardTitle>
            <GitBranch className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="min-h-[60px]">
              Set up continuous integration and deployment pipelines with AI assistance.
            </CardDescription>
            <div className="mt-4">
              <Link href="/cicd">
                <Button className="w-full flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Configure CI/CD
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Documentation</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="min-h-[60px]">
              Generate comprehensive documentation for your project with AI.
            </CardDescription>
            <div className="mt-4">
              <Link href="/documentation">
                <Button className="w-full flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Create Documentation
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-4">AI Provider Settings</h2>
        <p className="text-muted-foreground mb-6">
          Choose between OpenAI and DeepSeek for all AI-powered features. Adjust temperature to control creativity.
        </p>
        <div className="flex justify-center">
          <AISettings alwaysShow={true} />
        </div>
      </div>
    </div>
  )
}
