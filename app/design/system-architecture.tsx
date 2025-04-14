"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Save, Wand2, Copy, Check, RefreshCw, AlertTriangle, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import MermaidDiagram from "@/components/mermaid-diagram"
import { getSpecifications, getSpecificationById } from "../specification-generator/actions"
import { createRequirementForSpecification, saveSystemArchitecture } from "./system-architecture-actions"

export default function SystemArchitecture() {
  const { toast } = useToast()
  const [diagramCode, setDiagramCode] = useState(`graph LR
  A[Client] --> B(Load Balancer)
  B --> C{Application Servers}
  C --> D[Database]`)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [specificationId, setSpecificationId] = useState("")
  const [specifications, setSpecifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCopied, setIsCopied] = useState(false)
  const [selectedSpecification, setSelectedSpecification] = useState(null)
  const [previewError, setPreviewError] = useState(null)
  const [fetchError, setFetchError] = useState(null)
  const [authWarning, setAuthWarning] = useState(false)
  const [schemaWarning, setSchemaWarning] = useState(null)

  useEffect(() => {
    const fetchSpecifications = async () => {
      try {
        setFetchError(null)
        const result = await getSpecifications()
        if (result.success) {
          setSpecifications(result.data)
        } else {
          setFetchError(result.error || "Failed to load specifications")
          toast({
            title: "Error",
            description: result.error || "Failed to load specifications",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching specifications:", error)
        setFetchError(error.message || "Failed to load specifications")
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

  const handleSpecificationChange = async (id) => {
    setSpecificationId(id)

    if (id) {
      try {
        const result = await getSpecificationById(id)
        if (result.success) {
          setSelectedSpecification(result.data)
        }
      } catch (error) {
        console.error("Error fetching specification details:", error)
      }
    } else {
      setSelectedSpecification(null)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(diagramCode)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
    toast({
      title: "Copied!",
      description: "Diagram code copied to clipboard",
    })
  }

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
    setPreviewError(null)
    try {
      const result = await getSpecificationById(specificationId)

      if (!result.success) {
        throw new Error(result.error || "Failed to get specification details")
      }

      const specData = result.data

      // First try to extract architecture from the specification if it exists
      const extractedDiagram = extractDiagramFromSpecification(specData)

      if (extractedDiagram) {
        setDiagramCode(extractedDiagram)
        toast({
          title: "Diagram extracted",
          description: "System architecture diagram was extracted from the specification",
        })
      } else {
        // Generate a diagram based on the specification data
        const generatedDiagram = await generateDiagramWithAI(specData)
        setDiagramCode(generatedDiagram)
        toast({
          title: "System architecture generated",
          description: "System architecture has been generated based on the selected specification",
        })
      }
    } catch (error) {
      console.error("Error generating system architecture:", error)
      setPreviewError(error.message)
      toast({
        title: "Error",
        description: error.message || "Failed to generate system architecture",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Function to extract a diagram from the specification text
  const extractDiagramFromSpecification = (specData) => {
    // Look for mermaid diagram in system_architecture section
    if (specData.system_architecture) {
      // Try to find a mermaid diagram in the system_architecture field
      const mermaidMatch = specData.system_architecture.match(/```mermaid\s*([\s\S]*?)\s*```/)
      if (mermaidMatch && mermaidMatch[1]) {
        return mermaidMatch[1].trim()
      }

      // Try to find a graph pattern without mermaid markers
      const graphMatch = specData.system_architecture.match(/graph\s+[A-Z]+\s*([\s\S]*?)(?:\n\n|\n$|$)/)
      if (graphMatch && graphMatch[0]) {
        return graphMatch[0].trim()
      }
    }

    // If no diagram found in system_architecture, try to find it in the entire specification
    const allText = [
      specData.app_description,
      specData.functional_requirements,
      specData.non_functional_requirements,
      specData.system_architecture,
      specData.database_schema,
      specData.api_endpoints,
      specData.user_stories,
    ]
      .filter(Boolean)
      .join("\n\n")

    // Look for mermaid diagram in the entire text
    const mermaidMatch = allText.match(/```mermaid\s*([\s\S]*?)\s*```/)
    if (mermaidMatch && mermaidMatch[1]) {
      // Check if it's an architecture diagram (contains graph LR or graph TD)
      const diagramContent = mermaidMatch[1].trim()
      if (diagramContent.includes("graph LR") || diagramContent.includes("graph TD")) {
        return diagramContent
      }
    }

    return null
  }

  // Function to generate a diagram with AI based on the specification
  const generateDiagramWithAI = async (specData) => {
    try {
      // Prepare a prompt for the AI based on the specification
      const prompt = `
Generate a Mermaid diagram for the system architecture of the following application:

App Name: ${specData.app_name || "Unknown"}
App Type: ${specData.app_type || "web"}
Description: ${specData.app_description || ""}

${specData.system_architecture ? `System Architecture Description: ${specData.system_architecture}` : ""}
${specData.technical_constraints ? `Technical Constraints: ${specData.technical_constraints}` : ""}

Please generate a Mermaid diagram using the 'graph LR' or 'graph TD' syntax that shows the system architecture.
Include components like frontend, backend, databases, APIs, and any third-party services.
Show the relationships between components with arrows.
Use subgraphs to group related components.

IMPORTANT FORMATTING RULES:
1. Start with "graph LR" or "graph TD" on its own line
2. Put each subgraph declaration on its own line
3. Put quotes around subgraph names that contain spaces
4. Put quotes around node text that contains spaces or special characters
5. Put each node and connection on its own line
6. End each subgraph with "end" on its own line
7. Use proper spacing around arrows (e.g., "A --> B" not "A-->B")
8. Put comments on their own lines, not at the end of other lines
9. For multiple connections, use separate lines (e.g., "A --> B" and "B --> C" not "A --> B --> C")

Do not include any explanatory text, only the Mermaid diagram code.
`

      // Make a request to the AI API
      const response = await fetch("/api/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activeTab: "manual",
          requirements: prompt,
          language: "mermaid",
          framework: "diagram",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate diagram with AI")
      }

      const data = await response.json()

      // Extract the Mermaid diagram from the response
      let diagramCode = data.code

      // Clean up the response to extract just the Mermaid diagram
      const mermaidMatch = diagramCode.match(/```(?:mermaid)?\s*(graph[\s\S]*?)```/)
      if (mermaidMatch && mermaidMatch[1]) {
        diagramCode = mermaidMatch[1].trim()
      } else {
        // If no mermaid code block found, look for graph LR or graph TD
        const graphMatch = diagramCode.match(/(graph\s+(?:LR|TD)[\s\S]*?)(?:\n\n|\n$|$)/)
        if (graphMatch && graphMatch[1]) {
          diagramCode = graphMatch[1].trim()
        }
      }

      // If we still don't have a valid diagram, generate a default one
      if (!diagramCode.includes("graph")) {
        return generateDefaultDiagram(specData)
      }

      return diagramCode
    } catch (error) {
      console.error("Error generating diagram with AI:", error)
      // Fallback to a default diagram
      return generateDefaultDiagram(specData)
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
    setAuthWarning(false)
    try {
      // Find the specification to get its name for the project
      const spec = specifications.find((s) => s.id === specificationId)
      const projectName = spec ? spec.app_name : "Unknown Project"

      // Use the server action to create a requirement
      const requirementResult = await createRequirementForSpecification(specificationId, projectName)

      if (!requirementResult.success) {
        throw new Error(requirementResult.error || "Failed to create requirement")
      }

      // Now save the design using the server action
      const result = await saveSystemArchitecture({
        type: "architecture",
        diagramCode,
        requirementId: requirementResult.requirementId,
      })

      if (result.success) {
        toast({
          title: "System architecture saved",
          description: "Your system architecture has been saved successfully.",
        })

        // Clear any schema warnings since the save was successful
        setSchemaWarning(null)
      } else {
        // Check if this is an authentication error
        if (result.error && result.error.includes("not authenticated")) {
          setAuthWarning(true)
          // Still show a success message in development mode
          toast({
            title: "System architecture saved (Development Mode)",
            description: "Your system architecture has been saved with a default user ID.",
          })
        } else if (result.error && (result.error.includes("column") || result.error.includes("schema"))) {
          // This is a schema error
          toast({
            title: "Database Schema Error",
            description:
              "The designs table schema doesn't match what the code expects. We'll try to adapt automatically.",
            variant: "destructive",
          })
          console.error("Schema error:", result.error)
        } else {
          throw new Error(result.error || "Failed to save system architecture")
        }
      }
    } catch (error) {
      console.error("Error saving system architecture:", error)

      // Check if this is an authentication error
      if (error.message && error.message.includes("not authenticated")) {
        setAuthWarning(true)
        // Show a modified success message for development mode
        toast({
          title: "Development Mode",
          description: "Saving with default user ID. Authentication will be required in production.",
        })
      } else if (error.message && (error.message.includes("column") || error.message.includes("schema"))) {
        // This is a schema error
        toast({
          title: "Database Schema Error",
          description:
            "The designs table schema doesn't match what the code expects. We'll try to adapt automatically.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to save system architecture.",
          variant: "destructive",
        })
      }
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
              Use Mermaid graph syntax to define your system architecture. Select a specification and generate a diagram
              or create your own.
            </p>
          </div>

          {fetchError && (
            <div className="mb-4 p-4 border border-red-200 bg-red-50 rounded-md flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-medium">Error loading specifications</p>
                <p className="text-sm">{fetchError}</p>
                <p className="text-sm mt-1">
                  Please check your Supabase connection and make sure your environment variables are set correctly.
                </p>
              </div>
            </div>
          )}

          {authWarning && (
            <div className="mb-4 p-4 border border-amber-200 bg-amber-50 rounded-md flex items-center gap-2 text-amber-700">
              <Info className="h-5 w-5" />
              <div>
                <p className="font-medium">Development Mode</p>
                <p className="text-sm">
                  No authenticated user detected. Using a default user ID for development purposes.
                </p>
                <p className="text-sm mt-1">
                  In production, users will need to be authenticated to save system architecture diagrams.
                </p>
              </div>
            </div>
          )}

          {schemaWarning && (
            <div className="mb-4 p-4 border border-amber-200 bg-amber-50 rounded-md flex items-center gap-2 text-amber-700">
              <Info className="h-5 w-5" />
              <div>
                <p className="font-medium">Database Schema Notice</p>
                <p className="text-sm">{schemaWarning}</p>
                <p className="text-sm mt-1">
                  The system will attempt to create or adapt to the database schema automatically when you save.
                </p>
              </div>
            </div>
          )}

          <div className="mb-4">
            <Label htmlFor="specification">Select Specification</Label>
            <Select value={specificationId} onValueChange={handleSpecificationChange} disabled={isLoading}>
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

            {selectedSpecification && (
              <div className="mt-2 p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">
                  {selectedSpecification.app_name} - {selectedSpecification.app_type}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{selectedSpecification.app_description}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end mb-4 gap-2">
            <Button variant="outline" onClick={copyToClipboard} className="gap-2" disabled={!diagramCode}>
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {isCopied ? "Copied" : "Copy"}
            </Button>
            <Button
              variant="outline"
              onClick={generateFromSpecification}
              disabled={isGenerating || !specificationId}
              className="gap-2"
            >
              {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {isGenerating ? "Generating..." : "Generate from Specification"}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Textarea
                value={diagramCode}
                onChange={(e) => setDiagramCode(e.target.value)}
                className="font-mono text-sm h-[400px]"
                placeholder="Enter Mermaid flowchart code here or generate from a specification..."
              />
              <Button
                onClick={handleSave}
                disabled={isSubmitting || !specificationId || !diagramCode}
                className="mt-4 gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save Architecture"}
              </Button>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Preview:</div>
              <div className="border rounded-md p-4 h-[400px] overflow-auto bg-white">
                {diagramCode ? (
                  <MermaidDiagram code={diagramCode} className="h-full w-full" />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No diagram to preview. Generate or enter a diagram.
                  </div>
                )}
                {previewError && (
                  <div className="mt-2 p-2 text-sm text-red-500 bg-red-50 border border-red-200 rounded">
                    Error: {previewError}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Update the generateDefaultDiagram function to ensure proper formatting of node labels

function generateDefaultDiagram(specData) {
  const appName = specData.app_name || "Application"
  const appType = specData.app_type || "web"

  let diagram = `graph LR\n`

  // Client section
  diagram += `  subgraph Client\n`
  diagram += `    Browser(("${"Browser"}"))\n`
  if (appType === "mobile") {
    diagram += `    MobileApp(("${"Mobile App"}"))\n`
  }
  diagram += `  end\n\n`

  // Server section
  diagram += `  subgraph Server\n`
  diagram += `    LB(("Load Balancer"))\n`
  diagram += `    API(("API Gateway"}"))\n`
  diagram += `    Auth(("Authentication"))\n`
  diagram += `    Logic(("Business Logic"))\n`
  diagram += `  end\n\n`

  // Database section
  diagram += `  subgraph Database\n`
  diagram += `    DB(("Database"))\n`
  diagram += `  end\n\n`

  // Connections - one per line
  diagram += `  Browser --> LB\n`
  if (appType === "mobile") {
    diagram += `  MobileApp --> LB\n`
  }
  diagram += `  LB --> API\n`
  diagram += `  API --> Auth\n`
  diagram += `  API --> Logic\n`
  diagram += `  Logic --> DB\n`

  // Add cloud services if mentioned in the specification
  if (
    specData.system_architecture &&
    (specData.system_architecture.toLowerCase().includes("aws") ||
      specData.system_architecture.toLowerCase().includes("cloud") ||
      specData.system_architecture.toLowerCase().includes("s3"))
  ) {
    diagram += `\n  subgraph "Cloud Services"\n`
    diagram += `    Storage(("Storage"))\n`
    diagram += `    Notification(("Notifications"))\n`
    diagram += `  end\n\n`
    diagram += `  Logic --> Storage\n`
    diagram += `  Logic --> Notification\n`
  }

  diagram += `\n`

  return diagram
}
