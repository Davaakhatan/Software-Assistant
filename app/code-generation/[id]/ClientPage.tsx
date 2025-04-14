"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Copy, Trash2 } from "lucide-react"
import { CodeBlock } from "@/components/code-block"
import { deleteGeneratedCode } from "../actions"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface CodeGenerationClientPageProps {
  data: any
  id: string
}

export default function CodeGenerationClientPage({ data, id }: CodeGenerationClientPageProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteGeneratedCode(id)
      if (result.success) {
        router.push("/code-generation/saved")
      } else {
        console.error("Failed to delete code:", result.error)
        alert(`Failed to delete: ${result.error}`)
      }
    } catch (error) {
      console.error("Error deleting code:", error)
      alert("An error occurred while deleting the code")
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
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
        <Button
          variant="outline"
          size="sm"
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this code generation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
