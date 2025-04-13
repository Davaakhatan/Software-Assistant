import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Code, FileText, GitBranch, LayoutDashboard, TestTube, Wand2 } from "lucide-react"

export default function AIFeaturesPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">AI-Powered SDLC Features</h1>
        <p className="text-muted-foreground">
          Enhance your software development lifecycle with AI-powered features using OpenAI and DeepSeek
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/specification-generator">
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Specification Generator
              </CardTitle>
              <CardDescription>Generate detailed software specifications</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Use AI to create comprehensive software specifications including functional requirements, non-functional
                requirements, system architecture, database schema, API endpoints, and user stories.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/design/system-architecture">
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <LayoutDashboard className="h-5 w-5 mr-2" />
                System Architecture
              </CardTitle>
              <CardDescription>Design system architecture diagrams</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Generate system architecture diagrams using AI based on your specifications. Visualize components,
                services, and their relationships.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/design/data-model">
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <LayoutDashboard className="h-5 w-5 mr-2" />
                Data Model
              </CardTitle>
              <CardDescription>Design database schemas and data models</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Create comprehensive data models and database schemas using AI based on your application requirements.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/code-generation">
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="h-5 w-5 mr-2" />
                Code Generation
              </CardTitle>
              <CardDescription>Generate code from specifications</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Transform your specifications into working code using AI. Support for multiple programming languages and
                frameworks.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/testing/test-case-generator">
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TestTube className="h-5 w-5 mr-2" />
                Test Case Generator
              </CardTitle>
              <CardDescription>Generate test cases and test code</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Create comprehensive test cases and test code using AI based on your specifications and requirements.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/ci-cd/pipeline-generator">
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <GitBranch className="h-5 w-5 mr-2" />
                CI/CD Pipeline Generator
              </CardTitle>
              <CardDescription>Generate CI/CD pipeline configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Create CI/CD pipeline configurations for various platforms using AI based on your project requirements.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/documentation/documentation-generator">
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Documentation Generator
              </CardTitle>
              <CardDescription>Generate project documentation</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Create comprehensive documentation for your project using AI based on your specifications and code.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/ai-assistant">
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wand2 className="h-5 w-5 mr-2" />
                AI Assistant
              </CardTitle>
              <CardDescription>Get help with any SDLC task</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Chat with an AI assistant specialized in software development. Get help with requirements, design,
                coding, testing, and more.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="text-xl font-semibold mb-2">AI Provider Settings</h2>
        <p className="text-sm mb-4">
          You can switch between OpenAI and DeepSeek for all AI-powered features using the AI Settings button at the
          bottom right of the screen.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-1">OpenAI (GPT-4o)</h3>
            <p className="text-sm text-muted-foreground">
              Powerful general-purpose AI model with strong capabilities across all SDLC tasks.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-1">DeepSeek Chat</h3>
            <p className="text-sm text-muted-foreground">
              Specialized AI model with strong focus on code generation and technical content.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
