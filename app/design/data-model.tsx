"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Save, Wand2, Copy, Check, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { saveDesign } from "./actions"
import MermaidDiagram from "@/components/mermaid-diagram"
import { getSpecifications, getSpecificationById } from "../specification-generator/actions"
import { getSupabase } from "@/lib/supabase"

export default function DataModel() {
  const { toast } = useToast()
  const [diagramCode, setDiagramCode] = useState(`classDiagram
    class User {
      +String id
      +String name
      +String email
      +String password
      +Date createdAt
      +Date updatedAt
    }
    
    class Profile {
      +String id
      +String userId
      +String bio
      +String avatar
      +Date createdAt
      +Date updatedAt
    }
    
    User "1" -- "1" Profile : has`)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [specificationId, setSpecificationId] = useState("")
  const [specifications, setSpecifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCopied, setIsCopied] = useState(false)
  const [selectedSpecification, setSelectedSpecification] = useState(null)
  const [previewError, setPreviewError] = useState(null)

  // Fetch specifications on component mount
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

  // Function to sanitize mermaid code and fix common syntax issues
  const sanitizeMermaidCode = (code) => {
    if (!code) return ""

    // Replace problematic characters in node text
    const sanitized = code
      // Fix class definitions with parentheses
      .replace(/class\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g, (match, className, content) => {
        // Replace parentheses in class content with HTML entities
        const fixedContent = content.replace(/$$/g, "&#40;").replace(/$$/g, "&#41;")
        return `class ${className} {${fixedContent}}`
      })

      // Fix relationship syntax
      .replace(/([A-Za-z0-9_]+)\s+"([^"]+)"\s+--\s+"([^"]+)"\s+([A-Za-z0-9_]+)/g, '$1 "$2" -- "$3" $4')

      // Ensure proper spacing in relationships
      .replace(/([A-Za-z0-9_]+)\s*--\s*([A-Za-z0-9_]+)/g, "$1 -- $2")

    return sanitized
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
      // Get the specification details
      const result = await getSpecificationById(specificationId)

      if (!result.success) {
        throw new Error(result.error || "Failed to get specification details")
      }

      const specData = result.data

      // First, try to extract a diagram from the specification if it exists
      const extractedDiagram = extractDiagramFromSpecification(specData)

      if (extractedDiagram) {
        // Sanitize the extracted diagram to ensure it's valid
        const sanitizedDiagram = sanitizeMermaidCode(extractedDiagram)
        setDiagramCode(sanitizedDiagram)
        toast({
          title: "Data model extracted",
          description: "Data model has been extracted from the specification.",
        })
      } else {
        // Generate a diagram based on the specification data using AI
        const generatedDiagram = await generateDiagramWithAI(specData)
        // Sanitize the generated diagram to ensure it's valid
        const sanitizedDiagram = sanitizeMermaidCode(generatedDiagram)
        setDiagramCode(sanitizedDiagram)
        toast({
          title: "Data model generated",
          description: "Data model has been generated based on the selected specification.",
        })
      }
    } catch (error) {
      console.error("Error generating data model:", error)
      setPreviewError(error.message)
      toast({
        title: "Error",
        description: error.message || "Failed to generate data model",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Function to extract a diagram from the specification text
  const extractDiagramFromSpecification = (specData) => {
    // Look for mermaid diagram in database_schema section
    if (specData.database_schema) {
      // Try to find a mermaid diagram in the database_schema field
      const mermaidMatch = specData.database_schema.match(/```mermaid\s*([\s\S]*?)\s*```/)
      if (mermaidMatch && mermaidMatch[1]) {
        return mermaidMatch[1].trim()
      }

      // Try to find a classDiagram pattern without mermaid markers
      const classMatch = specData.database_schema.match(/classDiagram\s*([\s\S]*?)(?:\n\n|\n$|$)/)
      if (classMatch && classMatch[0]) {
        return classMatch[0].trim()
      }

      // Try to find an erDiagram pattern without mermaid markers
      const erMatch = specData.database_schema.match(/erDiagram\s*([\s\S]*?)(?:\n\n|\n$|$)/)
      if (erMatch && erMatch[0]) {
        return erMatch[0].trim()
      }
    }

    // If no diagram found in database_schema, try to find it in the entire specification
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
      // Check if it's a data model diagram (contains classDiagram or erDiagram)
      const diagramContent = mermaidMatch[1].trim()
      if (diagramContent.includes("classDiagram") || diagramContent.includes("erDiagram")) {
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
Generate a Mermaid diagram for the data model of the following application:

App Name: ${specData.app_name || "Unknown"}
App Type: ${specData.app_type || "web"}
Description: ${specData.app_description || ""}

${specData.database_schema ? `Database Schema Description: ${specData.database_schema}` : ""}
${specData.functional_requirements ? `Functional Requirements: ${specData.functional_requirements}` : ""}

Please generate a Mermaid diagram using the 'classDiagram' syntax that shows the data model.
Include entity classes with their properties and data types.
Show relationships between entities with proper cardinality (one-to-one, one-to-many, many-to-many).
Use proper notation for inheritance, composition, and aggregation if applicable.
Avoid using parentheses in class properties or methods as they can cause syntax errors.
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
      const mermaidMatch = diagramCode.match(/```(?:mermaid)?\s*(classDiagram[\s\S]*?)```/)
      if (mermaidMatch && mermaidMatch[1]) {
        diagramCode = mermaidMatch[1].trim()
      } else {
        // If no mermaid code block found, look for classDiagram or erDiagram
        const classMatch = diagramCode.match(/(classDiagram[\s\S]*?)(?:\n\n|\n$|$)/)
        if (classMatch && classMatch[1]) {
          diagramCode = classMatch[1].trim()
        } else {
          const erMatch = diagramCode.match(/(erDiagram[\s\S]*?)(?:\n\n|\n$|$)/)
          if (erMatch && erMatch[1]) {
            diagramCode = erMatch[1].trim()
          }
        }
      }

      // If we still don't have a valid diagram, generate a default one
      if (!diagramCode.includes("classDiagram") && !diagramCode.includes("erDiagram")) {
        return generateDefaultDiagram(specData)
      }

      return diagramCode
    } catch (error) {
      console.error("Error generating diagram with AI:", error)
      // Fallback to a default diagram
      return generateDefaultDiagram(specData)
    }
  }

  // Function to generate a default diagram based on the specification data
  const generateDefaultDiagram = (specData) => {
    const appName = specData.app_name || "Application"
    const appType = specData.app_type || "web"

    let diagram = `classDiagram\n`

    // Add User class for all app types
    diagram += `  class User {\n`
    diagram += `    +String id\n`
    diagram += `    +String name\n`
    diagram += `    +String email\n`
    diagram += `    +String password\n`
    diagram += `    +Date createdAt\n`
    diagram += `    +Date updatedAt\n`
    diagram += `  }\n\n`

    // Add Profile class for all app types
    diagram += `  class Profile {\n`
    diagram += `    +String id\n`
    diagram += `    +String userId\n`
    diagram += `    +String bio\n`
    diagram += `    +String avatar\n`
    diagram += `    +Date createdAt\n`
    diagram += `    +Date updatedAt\n`
    diagram += `  }\n\n`

    // Add app-specific classes based on app type
    if (appType === "ecommerce") {
      // Product class
      diagram += `  class Product {\n`
      diagram += `    +String id\n`
      diagram += `    +String name\n`
      diagram += `    +String description\n`
      diagram += `    +Float price\n`
      diagram += `    +Int stock\n`
      diagram += `    +String[] images\n`
      diagram += `    +String categoryId\n`
      diagram += `    +Date createdAt\n`
      diagram += `    +Date updatedAt\n`
      diagram += `  }\n\n`

      // Category class
      diagram += `  class Category {\n`
      diagram += `    +String id\n`
      diagram += `    +String name\n`
      diagram += `    +String description\n`
      diagram += `    +Date createdAt\n`
      diagram += `    +Date updatedAt\n`
      diagram += `  }\n\n`

      // Order class
      diagram += `  class Order {\n`
      diagram += `    +String id\n`
      diagram += `    +String userId\n`
      diagram += `    +Float total\n`
      diagram += `    +String status\n`
      diagram += `    +String shippingAddress\n`
      diagram += `    +String paymentMethod\n`
      diagram += `    +Date createdAt\n`
      diagram += `    +Date updatedAt\n`
      diagram += `  }\n\n`

      // OrderItem class
      diagram += `  class OrderItem {\n`
      diagram += `    +String id\n`
      diagram += `    +String orderId\n`
      diagram += `    +String productId\n`
      diagram += `    +Int quantity\n`
      diagram += `    +Float price\n`
      diagram += `    +Date createdAt\n`
      diagram += `    +Date updatedAt\n`
      diagram += `  }\n\n`

      // Add relationships
      diagram += `  User "1" -- "1" Profile : has\n`
      diagram += `  User "1" -- "many" Order : places\n`
      diagram += `  Order "1" -- "many" OrderItem : contains\n`
      diagram += `  OrderItem "many" -- "1" Product : references\n`
      diagram += `  Product "many" -- "1" Category : belongs to\n`
    } else if (appType === "crm") {
      // Contact class
      diagram += `  class Contact {\n`
      diagram += `    +String id\n`
      diagram += `    +String userId\n`
      diagram += `    +String name\n`
      diagram += `    +String email\n`
      diagram += `    +String phone\n`
      diagram += `    +String company\n`
      diagram += `    +String status\n`
      diagram += `    +Date createdAt\n`
      diagram += `    +Date updatedAt\n`
      diagram += `  }\n\n`

      // Lead class
      diagram += `  class Lead {\n`
      diagram += `    +String id\n`
      diagram += `    +String userId\n`
      diagram += `    +String contactId\n`
      diagram += `    +String name\n`
      diagram += `    +String source\n`
      diagram += `    +Float value\n`
      diagram += `    +String status\n`
      diagram += `    +Date createdAt\n`
      diagram += `    +Date updatedAt\n`
      diagram += `  }\n\n`

      // Deal class
      diagram += `  class Deal {\n`
      diagram += `    +String id\n`
      diagram += `    +String userId\n`
      diagram += `    +String leadId\n`
      diagram += `    +String name\n`
      diagram += `    +Float value\n`
      diagram += `    +String stage\n`
      diagram += `    +Date closingDate\n`
      diagram += `    +Date createdAt\n`
      diagram += `    +Date updatedAt\n`
      diagram += `  }\n\n`

      // Add relationships
      diagram += `  User "1" -- "1" Profile : has\n`
      diagram += `  User "1" -- "many" Contact : manages\n`
      diagram += `  User "1" -- "many" Lead : manages\n`
      diagram += `  User "1" -- "many" Deal : manages\n`
      diagram += `  Contact "1" -- "many" Lead : associated with\n`
      diagram += `  Lead "1" -- "many" Deal : converts to\n`
    } else if (appType === "blog" || appType === "cms") {
      // Post class
      diagram += `  class Post {\n`
      diagram += `    +String id\n`
      diagram += `    +String userId\n`
      diagram += `    +String title\n`
      diagram += `    +String content\n`
      diagram += `    +String excerpt\n`
      diagram += `    +String[] tags\n`
      diagram += `    +String status\n`
      diagram += `    +Date publishedAt\n`
      diagram += `    +Date createdAt\n`
      diagram += `    +Date updatedAt\n`
      diagram += `  }\n\n`

      // Category class
      diagram += `  class Category {\n`
      diagram += `    +String id\n`
      diagram += `    +String name\n`
      diagram += `    +String description\n`
      diagram += `    +String slug\n`
      diagram += `    +Date createdAt\n`
      diagram += `    +Date updatedAt\n`
      diagram += `  }\n\n`

      // Comment class
      diagram += `  class Comment {\n`
      diagram += `    +String id\n`
      diagram += `    +String postId\n`
      diagram += `    +String userId\n`
      diagram += `    +String content\n`
      diagram += `    +String status\n`
      diagram += `    +Date createdAt\n`
      diagram += `    +Date updatedAt\n`
      diagram += `  }\n\n`

      // Add relationships
      diagram += `  User "1" -- "1" Profile : has\n`
      diagram += `  User "1" -- "many" Post : authors\n`
      diagram += `  User "1" -- "many" Comment : writes\n`
      diagram += `  Post "many" -- "many" Category : belongs to\n`
      diagram += `  Post "1" -- "many" Comment : has\n`
    } else {
      // Generic classes for other app types
      // Content class
      diagram += `  class Content {\n`
      diagram += `    +String id\n`
      diagram += `    +String userId\n`
      diagram += `    +String title\n`
      diagram += `    +String description\n`
      diagram += `    +String type\n`
      diagram += `    +String status\n`
      diagram += `    +Date createdAt\n`
      diagram += `    +Date updatedAt\n`
      diagram += `  }\n\n`

      // Settings class
      diagram += `  class Settings {\n`
      diagram += `    +String id\n`
      diagram += `    +String userId\n`
      diagram += `    +String key\n`
      diagram += `    +String value\n`
      diagram += `    +Date createdAt\n`
      diagram += `    +Date updatedAt\n`
      diagram += `  }\n\n`

      // Add relationships
      diagram += `  User "1" -- "1" Profile : has\n`
      diagram += `  User "1" -- "many" Content : creates\n`
      diagram += `  User "1" -- "many" Settings : configures\n`
    }

    return diagram
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

      // Now save the design with the requirement ID
      const result = await saveDesign({
        type: "data",
        diagramCode,
        requirementId,
      })

      if (result.success) {
        toast({
          title: "Data model saved",
          description: "Your data model has been saved successfully.",
        })
      } else {
        throw new Error(result.error || "Failed to save data model")
      }
    } catch (error) {
      console.error("Error saving data model:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save data model.",
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
            <h2 className="text-xl font-semibold mb-2">Data Model</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Use Mermaid class diagram syntax to define your data model. Select a specification and generate a diagram
              or create your own.
            </p>
          </div>

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
                placeholder="Enter Mermaid class diagram code here or generate from a specification..."
              />
              <Button
                onClick={handleSave}
                disabled={isSubmitting || !specificationId || !diagramCode}
                className="mt-4 gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save Data Model"}
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
