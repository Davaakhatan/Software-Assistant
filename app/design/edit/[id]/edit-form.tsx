"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { updateDesign } from "../../actions"
import MermaidDiagram from "@/components/mermaid-diagram"
import MermaidDiagramComponent from "@/components/mermaid-diagram-component"
import MermaidDiagramArchitecture from "@/components/mermaid-diagram-architecture"
import { useRouter } from "next/navigation"

export default function EditDesignForm({ design, requirements }) {
  const { toast } = useToast()
  const router = useRouter()
  const [diagramCode, setDiagramCode] = useState(design.diagram_code)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requirementId, setRequirementId] = useState(design.project_id || "")

  const handleSave = async () => {
    if (!requirementId) {
      toast({
        title: "Error",
        description: "Please select a requirement",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await updateDesign(design.id, {
        type: design.type,
        diagramCode,
        requirementId,
      })

      if (result.success) {
        toast({
          title: "Design updated",
          description: "Your design has been updated successfully.",
        })
        router.push(`/design/${design.id}`)
      } else {
        throw new Error(result.error || "Failed to update design")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update design",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4">
          <Label htmlFor="requirement">Select Requirement</Label>
          <Select value={requirementId} onValueChange={setRequirementId}>
            <SelectTrigger id="requirement" className="w-full">
              <SelectValue placeholder="Select a requirement" />
            </SelectTrigger>
            <SelectContent>
              {requirements.map((req) => (
                <SelectItem key={req.id} value={req.id}>
                  {req.project_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Textarea
              value={diagramCode}
              onChange={(e) => setDiagramCode(e.target.value)}
              className="font-mono text-sm h-[400px]"
            />
            <Button onClick={handleSave} disabled={isSubmitting || !requirementId} className="mt-4 gap-2">
              <Save className="h-4 w-4" />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Preview:</div>
            {design.type === "architecture" ? (
              <MermaidDiagramArchitecture code={diagramCode} className="h-[400px] overflow-auto" />
            ) : design.type === "data-model" ? (
              <MermaidDiagram code={diagramCode} className="h-[400px] overflow-auto" />
            ) : (
              <MermaidDiagramComponent code={diagramCode} className="h-[400px] overflow-auto" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
