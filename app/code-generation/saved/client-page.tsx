"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Code } from "lucide-react"
import { CodeCardHeader } from "@/components/code-card-header"

interface ClientPageProps {
  data: any[]
  deleteGeneratedCode: (id: string) => Promise<{ success: boolean; error?: string }>
}

export default function ClientPage({ data, deleteGeneratedCode }: ClientPageProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((item) => {
        // Safely extract requirements and truncate if it exists
        const requirements = item.requirements || ""
        const truncatedRequirements = requirements.length > 100 ? requirements.substring(0, 100) + "..." : requirements

        // Safely get app name from specifications
        const appName = item.specifications?.app_name || "N/A"

        // Safely get design type
        const designType = item.designs?.type || "N/A"

        return (
          <Card key={item.id} className="h-full flex flex-col">
            <CodeCardHeader
              id={item.id}
              language={item.language}
              framework={item.framework}
              createdAt={item.created_at}
              onDelete={deleteGeneratedCode}
            />
            <CardContent className="flex-grow">
              <div className="mb-4">
                <div className="text-sm font-medium mb-1">Requirements:</div>
                <div className="text-sm text-muted-foreground">{truncatedRequirements || "N/A"}</div>
              </div>
              {item.specification_id && (
                <div className="mb-4">
                  <div className="text-sm font-medium mb-1">Specification:</div>
                  <div className="text-sm text-muted-foreground">{appName}</div>
                </div>
              )}
              {item.design_id && (
                <div className="mb-4">
                  <div className="text-sm font-medium mb-1">Design:</div>
                  <div className="text-sm text-muted-foreground">{designType}</div>
                </div>
              )}
            </CardContent>
            <div className="p-4 pt-0 mt-auto">
              <Link href={`/code-generation/${item.id}`}>
                <Button className="w-full">
                  <Code className="mr-2 h-4 w-4" />
                  View Code
                </Button>
              </Link>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
