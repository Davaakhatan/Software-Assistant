import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Plus, Tag } from "lucide-react"
import { getSpecificationsImproved } from "../specification-generator/improved-actions"
import { formatDate } from "@/lib/utils"
import DeleteSpecificationButton from "../specifications/[id]/delete-button"

export default async function ImprovedSpecificationsList() {
  const { data: specifications, success } = await getSpecificationsImproved()

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <Link href="/specification-generator/improved">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Specification
          </Button>
        </Link>
      </div>

      <div className="flex flex-col items-start mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">System Specifications</h1>
        <p className="text-muted-foreground">View and manage your generated system specifications</p>
      </div>

      {success && specifications && specifications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specifications.map((spec) => (
            <Card key={spec.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{spec.app_name}</CardTitle>
                    <CardDescription>
                      {spec.specification_types?.name || spec.app_type}
                      <br />
                      Created on {formatDate(spec.created_at)}
                    </CardDescription>
                  </div>
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
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="line-clamp-3">{spec.app_description}</p>

                {spec.tags && spec.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                    {spec.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {spec.projects?.name && (
                  <div className="mt-3 text-sm text-muted-foreground">Project: {spec.projects.name}</div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Link href={`/specifications/${spec.id}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
                <DeleteSpecificationButton specId={spec.id} />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No specifications found</p>
            <Link href="/specification-generator/improved">
              <Button>Create Specification</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
