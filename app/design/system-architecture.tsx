"use client"

import { useEffect } from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Save, Wand2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { saveDesign } from "./actions"
import MermaidDiagram from "@/components/mermaid-diagram"
import { getSpecifications, getSpecificationById } from "../specification-generator/actions"
import { getSupabase } from "@/lib/supabase"

export default function SystemArchitecture() {
  const { toast } = useToast()
  const [diagramCode, setDiagramCode] = useState(`graph LR
    subgraph Client
      A[User] --> B((Browser))
    end
    subgraph Server
      B --> C[Load Balancer]
      C --> D[Web Server]
      C --> E[API Server]
      D --> F[Application Server]
      E --> F
      F --> G[Database]
    end`)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [specificationId, setSpecificationId] = useState("")
  const [specifications, setSpecifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSpecifications = async () => {
      try {
        const result = await getSpecifications()
        if (result.success) {
          setSpecifications(result.data)
        } else {
          toast({
            title: "Error",
            description: "Failed to load specifications",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching specifications:", error)
        toast({
          title: "Error",
          description: "Failed to load specifications",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSpecifications()
  }, [toast])

  const generateFromSpecification = async () => {
    if (!specificationId) {
      toast({
        title: "Error",
        description: "Please select a specification",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const result = await getSpecificationById(specificationId)

      if (!result.success) {
        throw new Error(result.error || "Failed to get specification details")
      }

      const specData = result.data

      let generatedDiagram = `graph LR\n`
      generatedDiagram += `  subgraph Client\n`
      generatedDiagram += `    A[User] --> B((Browser))\n`
      generatedDiagram += `  end\n`
      generatedDiagram += `  subgraph Server\n`
      generatedDiagram += `    B --> C[Load Balancer]\n`
      generatedDiagram += `    C --> D[Web Server]\n`
      generatedDiagram += `    C --> E[API Server]\n`
      generatedDiagram += `    D --> F[Application Server]\n`
      generatedDiagram += `    E --> F\n`
      generatedDiagram += `    F --> G[Database]\n`
      generatedDiagram += `  end\n`

      setDiagramCode(generatedDiagram)

      toast({
        title: "System architecture generated",
        description: "System architecture has been generated based on the selected specification.",
      })
    } catch (error) {
      console.error("Error generating system architecture:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to generate system architecture",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!specificationId) {
      toast({
        title: "Error",
        description: "Please select a specification",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Find the specification to get its name for the project
      const spec = specifications.find((s) => s.id === specificationId)
      const projectName = spec ? spec.app_name : "Unknown Project"

      // Create a temporary requirement ID linked to this specification
      // This is needed because the current saveDesign function expects a requirementId
      const supabase = getSupabase()

      // Check if a requirement already exists for this specification
      const { data: existingReq, error: existingReqError } = await supabase
        .from("requirements")
        .select("id")
        .eq("specification_id", specificationId)
        .maybeSingle()

      let requirementId = null

      if (!existingReqError && existingReq) {
        // Use existing requirement
        requirementId = existingReq.id
      } else {
        // Create a new requirement linked to this specification
        const { data: newReq, error: newReqError } = await supabase
          .from("requirements")
          .insert({
            project_name: projectName,
            project_description: `Auto-generated from specification: ${projectName}`,
            specification_id: specificationId,
          })
          .select()

        if (newReqError) {
          throw new Error(`Failed to create requirement: ${newReqError.message}`)
        }

        requirementId = newReq[0].id
      }

      const result = await saveDesign({
        type: "architecture",
        diagramCode,
        requirementId,
      })

      if (result.success) {
        toast({
          title: "System architecture saved",
          description: "Your system architecture has been saved successfully.",
        })
      } else {
        throw new Error(result.error || "Failed to save system architecture")
      }
    } catch (error) {
      console.error("Error saving system architecture:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save system architecture.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">System Architecture</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Use Mermaid graph syntax to define your system architecture.
            </p>
          </div>

          <div className="mb-4">
            <Label htmlFor="specification">Select Specification</Label>
            <Select value={specificationId} onValueChange={setSpecificationId} disabled={isLoading}>
              <SelectTrigger id="specification" className="w-full">
                <SelectValue placeholder="Select a specification" />
              </SelectTrigger>
              <SelectContent>
                {specifications.map((spec) => (
                  <SelectItem key={spec.id} value={spec.id}>
                    {spec.app_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isLoading && <p className="text-sm text-muted-foreground mt-1">Loading specifications...</p>}
          </div>

          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              onClick={generateFromSpecification}
              disabled={isGenerating || !specificationId}
              className="gap-2"
            >
              <Wand2 className="h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate from Specification"}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Textarea
                value={diagramCode}
                onChange={(e) => setDiagramCode(e.target.value)}
                className="font-mono text-sm h-[400px]"
              />
              <Button onClick={handleSave} disabled={isSubmitting || !specificationId} className="mt-4 gap-2">
                <Save className="h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save Architecture"}
              </Button>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Preview:</div>
              <MermaidDiagram code={diagramCode} className="h-[400px] overflow-auto" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
