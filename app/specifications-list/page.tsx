import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"
import { getSpecifications } from "../specification-generator/actions"
import { formatDate } from "@/lib/utils"
import DeleteSpecificationButton from "../specifications/[id]/delete-button"

export default async function SpecificationsList() {
  const { data: specifications, success } = await getSpecifications()

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <Link href="/specification-generator">
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
                <CardTitle>{spec.app_name}</CardTitle>
                <CardDescription>
                  {spec.app_type.charAt(0).toUpperCase() + spec.app_type.slice(1)} Application
                  <br />
                  Created on {formatDate(spec.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="line-clamp-3">{spec.app_description}</p>
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
            <Link href="/specification-generator">
              <Button>Create Specification</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
