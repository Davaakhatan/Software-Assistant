"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useState } from "react"
import { deletePipeline } from "../../actions"
import { useRouter } from "next/navigation"

export default function DeletePipelineButton({ id }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this pipeline?")) {
      setIsDeleting(true)
      try {
        const result = await deletePipeline(id)
        if (result.success) {
          router.refresh()
        } else {
          alert(`Failed to delete: ${result.error}`)
        }
      } catch (error) {
        alert(`Error: ${error.message}`)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1 text-red-500 hover:text-red-700 hover:bg-red-50"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      <Trash2 className="h-3.5 w-3.5" />
      {isDeleting ? "Deleting..." : "Delete"}
    </Button>
  )
}
