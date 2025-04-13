import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"
import { getRequirements } from "../requirements/actions"
import { formatDate } from "@/lib/utils"

export default async function RequirementsList() {
  const { data: requirements, success } = await getRequirements()

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <Link href="/requirements">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Requirements
          </Button>
        </Link>
      </div>

      <div className="flex flex-col items-start mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Saved Requirements</h1>
        <p className="text-muted-foreground">View and manage your project requirements</p>
      </div>

      {success && requirements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requirements.map((requirement) => (
            <Card key={requirement.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{requirement.project_name}</CardTitle>
                <CardDescription>Created on {formatDate(requirement.created_at)}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="line-clamp-3">{requirement.project_description}</p>
              </CardContent>
              <CardFooter>
                <Link href={`/requirements/${requirement.id}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No requirements found</p>
            <Link href="/requirements">
              <Button>Create Requirements</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
