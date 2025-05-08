import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Tag, Calendar, Clock, User } from "lucide-react"
import { getSpecificationByIdImproved } from "../../specification-generator/improved-actions"
import { formatDate } from "@/lib/utils"
import DownloadButton from "./download-button"
import DeleteSpecificationButton from "./delete-button"
import { SectionEditor } from "./section-editor"
import CodeGenerationButton from "./code-generation-button"

export default async function ImprovedSpecificationDetails({ params }) {
  const { data: spec, success, error } = await getSpecificationByIdImproved(params.id)

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

  // Get all sections and sort them by display order
  const sections = Object.values(spec.sections || {}).sort((a, b) => a.displayOrder - b.displayOrder)

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <Link href="/specifications-list/improved">
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
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight">{spec.app_name}</h1>
          <Badge
            variant={
              spec.status === "approved"
                ? "default"
                : spec.status === "in-review"
                  ? "secondary"
                  : spec.status === "archived"
                    ? "outline"
                    : "destructive"
            }
          >
            {spec.status}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-4 text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>{spec.specification_types?.name || spec.app_type}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Created on {formatDate(spec.created_at)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Version {spec.version}</span>
          </div>
        </div>

        {spec.tags && spec.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {spec.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {spec.projects?.name && <div className="text-sm text-muted-foreground">Project: {spec.projects.name}</div>}
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
            {spec.sections.target_audience && (
              <div>
                <h3 className="font-medium">Target Audience</h3>
                <p>{spec.sections.target_audience.content}</p>
              </div>
            )}
            {spec.sections.key_features && (
              <div>
                <h3 className="font-medium">Key Features</h3>
                <p className="whitespace-pre-wrap">{spec.sections.key_features.content}</p>
              </div>
            )}
            {spec.sections.technical_constraints && (
              <div>
                <h3 className="font-medium">Technical Constraints</h3>
                <p>{spec.sections.technical_constraints.content}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={sections[0]?.name || "functional_requirements"} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:grid-cols-10">
          {sections.map((section) => (
            <TabsTrigger key={section.id} value={section.name}>
              {section.name
                .split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </TabsTrigger>
          ))}
        </TabsList>

        {sections.map((section) => (
          <TabsContent key={section.id} value={section.name} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {section.name
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <SectionEditor specId={params.id} sectionId={section.id} initialContent={section.content} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {spec.comments && spec.comments.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Comments</h2>
          <div className="space-y-4">
            {spec.comments.map((comment) => (
              <Card key={comment.id}>
                <CardHeader className="py-3">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{comment.users?.name || "Anonymous"}</div>
                    <div className="text-sm text-muted-foreground">{formatDate(comment.created_at)}</div>
                  </div>
                  {comment.specification_sections && (
                    <div className="text-sm text-muted-foreground">
                      On:{" "}
                      {comment.specification_sections.name
                        .split("_")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="py-3">
                  <p>{comment.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end mt-6 gap-2">
        <CodeGenerationButton specId={params.id} />
        <Link href="/design">
          <Button className="gap-2">Continue to System Design</Button>
        </Link>
      </div>
    </div>
  )
}
