"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { updateSpecificationSection } from "../../specification-generator/improved-actions"

interface SectionEditorProps {
  specId: string
  sectionId: string
  initialContent: string
}

export function SectionEditor({ specId, sectionId, initialContent }: SectionEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(initialContent || "")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateSpecificationSection(specId, sectionId, content)

      if (result.success) {
        toast({
          title: "Section updated",
          description: "The section content has been updated successfully.",
        })
        setIsEditing(false)
      } else {
        toast({
          title: "Error updating section",
          description: result.error || "An error occurred while updating the section.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setContent(initialContent || "")
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="space-y-4">
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} className="w-full" />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {content ? (
        <div className="whitespace-pre-wrap">{content}</div>
      ) : (
        <div className="text-muted-foreground italic">No content yet. Click Edit to add content.</div>
      )}
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setIsEditing(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>
    </div>
  )
}
