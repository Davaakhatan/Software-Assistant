"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { deleteDesign } from "../actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function DeleteDesignButtonClient({ id }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    console.log("handleDelete called")
    setIsDeleting(true)
    try {
      const result = await deleteDesign(id)
      if (result.success) {
        toast({
          title: "Design deleted",
          description: "The design has been deleted successfully.",
        })
        setIsOpen(false)
        router.push("/design-list")
      } else {
        throw new Error(result.error || "Failed to delete design")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete design",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        console.log("AlertDialog onOpenChange:", open)
        setIsOpen(open)
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          className="gap-2"
          onClick={() => {
            console.log("Delete button clicked, setting isOpen to true")
            setIsOpen(true)
          }}
        >
          <Trash className="h-4 w-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this design.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              console.log("Cancel clicked, setting isOpen to false")
              setIsOpen(false)
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              console.log("AlertDialogAction clicked")
              handleDelete()
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
