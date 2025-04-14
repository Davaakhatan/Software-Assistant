"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Copy } from "lucide-react"
import { CodeBlock } from "@/components/code-block"

interface CodeGenerationClientPageProps {
  data: any
}

export default function CodeGenerationClientPage({ data }: CodeGenerationClientPageProps) {
  const handleCopyCode = () => {
    navigator.clipboard
      .writeText(data.generated_code)
      .then(() => {
        alert("Code copied to clipboard!")
      })
      .catch((err) => {
        console.error("Failed to copy code:", err)
        alert("Failed to copy code to clipboard")
      })
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-6">
        <Link href="/code-generation/saved">
          <Button variant="outline" size="sm" className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Saved Code
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {data.language} / {data.framework}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{data.requirements || "No requirements specified"}</p>
          </CardContent>
        </Card>

        {data.specifications && (
          <Card>
            <CardHeader>
              <CardTitle>Specification: {data.specifications.app_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>App Name: {data.specifications.app_name}</p>
            </CardContent>
          </Card>
        )}

        {data.designs && (
          <Card>
            <CardHeader>
              <CardTitle>Design: {data.designs.type}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Design Type: {data.designs.type}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Generated Code</CardTitle>
            <Button variant="outline" size="sm" className="copy-button" onClick={handleCopyCode}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Code
            </Button>
          </CardHeader>
          <CardContent>
            <CodeBlock code={data.generated_code} language={data.language.toLowerCase()} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
