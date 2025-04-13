import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getSpecificationById } from "../../specification-generator/actions"
import { formatDate } from "@/lib/utils"
import DownloadButton from "./download-button"
import DeleteSpecificationButton from "./delete-button"

export default async function SpecificationDetails({ params }) {
  const { data: spec, success, error } = await getSpecificationById(params.id)

  if (!success) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center mb-8">
          <Link href="/specifications-list">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Specifications
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">{error || "Specification not found"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <Link href="/specifications-list">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Specifications
          </Button>
        </Link>
        <div className="flex gap-2">
          <DeleteSpecificationButton specId={params.id} />
          <DownloadButton spec={spec} />
        </div>
      </div>

      <div className="flex flex-col items-start mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{spec.app_name}</h1>
        <div className="flex flex-col md:flex-row gap-2 text-muted-foreground">
          <p>{spec.app_type.charAt(0).toUpperCase() + spec.app_type.slice(1)} Application</p>
          <span className="hidden md:inline">•</span>
          <p>Created on {formatDate(spec.created_at)}</p>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Application Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Description</h3>
              <p>{spec.app_description}</p>
            </div>
            {spec.target_audience && (
              <div>
                <h3 className="font-medium">Target Audience</h3>
                <p>{spec.target_audience}</p>
              </div>
            )}
            {spec.key_features && (
              <div>
                <h3 className="font-medium">Key Features</h3>
                <p className="whitespace-pre-wrap">{spec.key_features}</p>
              </div>
            )}
            {spec.technical_constraints && (
              <div>
                <h3 className="font-medium">Technical Constraints</h3>
                <p>{spec.technical_constraints}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="functional" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:grid-cols-10">
          <TabsTrigger value="functional">Functional</TabsTrigger>
          <TabsTrigger value="non-functional">Non-Functional</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="api">API Design</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="scalability">Scalability</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="future">Future</TabsTrigger>
        </TabsList>
        <TabsContent value="functional" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Functional Requirements</CardTitle>
              <CardDescription>What the system should do</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap">{spec.functional_requirements}</div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="non-functional" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Non-Functional Requirements</CardTitle>
              <CardDescription>Quality attributes of the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap">{spec.non_functional_requirements}</div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="architecture" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>System Architecture</CardTitle>
              <CardDescription>High-level design of the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap">{spec.system_architecture}</div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="api" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>API Design</CardTitle>
              <CardDescription>RESTful API endpoints and formats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap">{spec.api_design}</div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="database" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Schema</CardTitle>
              <CardDescription>Database tables, relationships, and indexes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap">{spec.database_schema}</div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="scalability" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Scalability & Performance</CardTitle>
              <CardDescription>Strategies for handling growth and maintaining performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap">{spec.scalability_considerations}</div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Considerations</CardTitle>
              <CardDescription>Security measures and best practices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap">{spec.security_considerations}</div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="deployment" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Plan</CardTitle>
              <CardDescription>Strategy for deploying and maintaining the application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap">{spec.deployment_plan}</div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="monitoring" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring & Logging</CardTitle>
              <CardDescription>Approach to monitoring system health and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap">{spec.monitoring_logging}</div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="future" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Future Enhancements</CardTitle>
              <CardDescription>Planned improvements and feature additions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap">{spec.future_enhancements}</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Link href="/design">
          <Button className="gap-2">Continue to System Design</Button>
        </Link>
      </div>
    </div>
  )
}
