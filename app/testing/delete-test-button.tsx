"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { deleteTestCase } from "./actions"
import { useRouter } from "next/navigation"
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

interface DeleteTestButtonProps {
  id: string
  redirectTo?: string
  onSuccess?: () => void
}

export default function DeleteTestButton({ id, redirectTo, onSuccess }: DeleteTestButtonProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const handleDelete = async () => {
    if (!id) return

    setIsDeleting(true)
    try {
      const result = await deleteTestCase(id)

      if (result.success) {
        toast({
          title: "Test deleted",
          description: "The test case has been deleted successfully.",
        })

        // Call the onSuccess callback if provided
        if (onSuccess) {
          onSuccess()
        }

        // Redirect if a redirect path is provided
        if (redirectTo) {
          router.push(redirectTo)
        }
      } else {
        console.error("Error deleting test:", result.error)
        toast({
          title: "Error",
          description: result.error || "Failed to delete the test case.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error in handleDelete:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the test case.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowConfirmDialog(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConfirmDialog(true)}
        disabled={isDeleting}
        className="text-destructive hover:bg-destructive/10"
      >
        <Trash className="h-4 w-4 mr-1" />
        {isDeleting ? "Deleting..." : "Delete"}
      </Button>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the test case.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
