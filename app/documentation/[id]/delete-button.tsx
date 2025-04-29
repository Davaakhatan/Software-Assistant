"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function DeleteDocumentationButton({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this documentation?")) {
      return
    }

    setIsDeleting(true)

    try {
      const supabase = createClientComponentClient()

      const { error } = await supabase.from("documentations").delete().eq("id", id)

      if (error) {
        throw error
      }

      router.push("/documentation")
      router.refresh()
    } catch (error) {
      console.error("Error deleting documentation:", error)
      alert("Failed to delete documentation")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="flex items-center gap-2">
      <Trash className="h-4 w-4" />
      {isDeleting ? "Deleting..." : "Delete"}
    </Button>
  )
}
