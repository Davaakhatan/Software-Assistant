import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Edit, FileText } from "lucide-react"
import { getRequirementDetails } from "../actions"
import { formatDate } from "@/lib/utils"
import DeleteRequirementButton from "./delete-button"
import { Suspense } from "react"

export default async function RequirementDetails({ params }) {
  const { data, success, error } = await getRequirementDetails(params.id)

  if (!success) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center mb-8">
          <Link href="/requirements-list">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Requirements
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">{error || "Requirement not found"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { requirement, userStories, functionalRequirements } = data

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      default:
        return ""
    }
  }

  const getPriorityVariant = (priority) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "outline"
      default:
        return "default"
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <Link href="/requirements-list">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Requirements
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/requirements/edit/${params.id}`}>
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Suspense
            fallback={
              <Button variant="destructive" disabled>
                Delete
              </Button>
            }
          >
            <DeleteRequirementButton id={params.id} />
          </Suspense>
        </div>
      </div>

      <div className="flex flex-col items-start mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{requirement.project_name}</h1>
        <p className="text-muted-foreground">Created on {formatDate(requirement.created_at)}</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Project Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{requirement.project_description}</p>
          </CardContent>
        </Card>

        {userStories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>User Stories</CardTitle>
              <CardDescription>What users need from your application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userStories.map((story) => (
                <div key={story.id} className="p-4 border rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">As a {story.role}</h3>
                    <Badge className={getPriorityColor(story.priority)} variant={getPriorityVariant(story.priority)}>
                      {story.priority === "high"
                        ? "Must Have"
                        : story.priority === "medium"
                          ? "Should Have"
                          : "Nice to Have"}
                    </Badge>
                  </div>
                  <p>I want to {story.action}</p>
                  <p className="text-muted-foreground mt-2">So that {story.benefit}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {functionalRequirements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Functional Requirements</CardTitle>
              <CardDescription>Specific features and capabilities needed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {functionalRequirements.map((req) => (
                <div key={req.id} className="p-4 border rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">Requirement</h3>
                    <Badge className={getPriorityColor(req.priority)} variant={getPriorityVariant(req.priority)}>
                      {req.priority === "high"
                        ? "Must Have"
                        : req.priority === "medium"
                          ? "Should Have"
                          : "Nice to Have"}
                    </Badge>
                  </div>
                  <p>{req.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Link href="/design">
            <Button className="gap-2">
              <FileText className="h-4 w-4" />
              Continue to System Design
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
