"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Copy, Download } from "lucide-react"
import { formatDate } from "@/lib/utils"
import DeleteCodeButton from "./delete-button"
import { Suspense } from "react"
import { getGeneratedCodeById } from "../actions"

export default async function ViewGeneratedCodePage({ params }) {
  const { data: code, success, error } = await getGeneratedCodeById(params.id)

  if (!success) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center mb-8">
          <Link href="/code-generation">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Code Generation
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Code not found or an error occurred</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <Link href="/code-generation">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Code Generation
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              navigator.clipboard.writeText(code.generated_code)
            }}
          >
            <Copy className="h-4 w-4" />
            Copy Code
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              const blob = new Blob([code.generated_code], { type: "text/plain" })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = `${code.specifications?.app_name || "code"}.${code.language === "typescript" ? "ts" : "js"}`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
            }}
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Suspense
            fallback={
              <Button variant="destructive" disabled>
                Delete
              </Button>
            }
          >
            <DeleteCodeButton id={params.id} />
          </Suspense>
        </div>
      </div>

      <div className="flex flex-col items-start mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{code.specifications?.app_name || "Generated Code"}</h1>
        <div className="flex flex-col md:flex-row gap-2 text-muted-foreground">
          <p>
            {code.language} / {code.framework}
          </p>
          <span className="hidden md:inline">•</span>
          <p>Created on {formatDate(code.created_at)}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generated Code</CardTitle>
          <CardDescription>
            {code.designs?.type === "architecture"
              ? "Generated from System Architecture"
              : code.designs?.type === "data-model"
                ? "Generated from Data Model"
                : code.designs?.type === "component"
                  ? "Generated from Component Diagram"
                  : "Generated from Requirements"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[600px] text-sm font-mono">
            {code.generated_code}
          </pre>
        </CardContent>
      </Card>

      {code.requirements && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
            <CardDescription>The requirements used to generate this code</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md overflow-auto max-h-[300px]">
              <p className="whitespace-pre-wrap">{code.requirements}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
