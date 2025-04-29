"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { deletePipeline } from "../actions"

export default function DeletePipelineButton({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this pipeline?")) {
      setIsDeleting(true)
      try {
        await deletePipeline(id)
        router.refresh()
      } catch (error) {
        console.error("Error deleting pipeline:", error)
        alert("Failed to delete pipeline")
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
      {isDeleting ? "Deleting..." : "Delete"}
    </Button>
  )
}
