"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { deleteTestCase } from "./actions"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DeleteTestButtonProps {
  testId: string
  onSuccess?: () => void
}

export default function DeleteTestButton({ testId, onSuccess }: DeleteTestButtonProps) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleDelete = async () => {
    if (!testId) {
      console.error("No test ID provided")
      toast({
        title: "Error",
        description: "No test ID provided",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)
    console.log("Deleting test case with ID:", testId)

    try {
      const result = await deleteTestCase(testId)

      if (result.success) {
        toast({
          title: "Success",
          description: "Test case deleted successfully",
        })
        setIsOpen(false)
        if (onSuccess) {
          onSuccess()
        }
      } else {
        console.error("Failed to delete test case:", result.error)
        toast({
          title: "Error",
          description: result.error || "Failed to delete test case",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting test case:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
          <Trash className="h-4 w-4 text-red-500" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the test case.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsOpen(false)}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-500 hover:bg-red-600"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
