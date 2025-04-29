"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Save, Wand2, Copy, Check, RefreshCw, AlertTriangle, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import MermaidDiagram from "@/components/mermaid-diagram-component"
import { getSpecifications, getSpecificationById } from "../specification-generator/actions"
import { createRequirementForSpecification, saveComponentDiagram } from "./component-diagram-actions"
import { useAIProvider } from "@/context/ai-provider-context"
import { generateAIText } from "@/lib/ai-service"

// Default diagram template that is known to work
const DEFAULT_DIAGRAM = `classDiagram
  class User {
    +String id
    +String name
    +String email
    +authenticate()
    +updateProfile()
  }
  class Product {
    +String id
    +String name
    +Number price
    +getDetails()
    +updateStock()
  }
  class Order {
    +String id
    +Date createdAt
    +String status
    +processPayment()
    +ship()
  }
  User "1" --> "*" Order: places
  Order "*" --> "*" Product: contains`

export default function ComponentDiagram() {
  const { toast } = useToast()
  const { provider, temperature } = useAIProvider()
  const [diagramCode, setDiagramCode] = useState(DEFAULT_DIAGRAM)
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
  const [tempIdWarning, setTempIdWarning] = useState(false)
  const [key, setKey] = useState(0) // Used to force re-render of diagram
  const [apiKey, setApiKey] = useState("") // Store API key

  useEffect(() => {
    // Check if API key exists and load it
    if (typeof window !== "undefined") {
      const storedApiKey = localStorage.getItem("openai_api_key")
      setApiKey(storedApiKey || "")
      console.log("API key loaded from localStorage:", storedApiKey ? "Found key" : "No key found")
    }

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
            description: "Failed to load specifications",
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

  // Function to clean up AI-generated Mermaid code
  const cleanMermaidCode = (code) => {
    // Remove any markdown code block markers
    let cleaned = code
      .replace(/```mermaid/g, "")
      .replace(/```/g, "")
      .trim()

    // Ensure it starts with classDiagram
    if (!cleaned.startsWith("classDiagram")) {
      cleaned = "classDiagram\n" + cleaned
    }

    return cleaned
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

    // Check if API key exists
    if (!apiKey || !apiKey.startsWith("sk-")) {
      toast({
        title: "API Key Missing",
        description: "Please add your OpenAI API key in the Settings page",
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

      // Prepare a prompt for the AI based on the specification
      const prompt = `
Generate a Mermaid class diagram for the following application:

App Name: ${specData.app_name || "Unknown"}
App Type: ${specData.app_type || "web"}
Description: ${specData.app_description || ""}

Requirements:
1. Use the 'classDiagram' syntax for the Mermaid diagram
2. Include appropriate classes based on the app type (${specData.app_type || "web"})
3. Define attributes and methods for each class
4. Show relationships between classes with proper notation
5. Use appropriate relationship types (inheritance, composition, association)

Your response should ONLY contain the Mermaid diagram code, nothing else.
Do not include any explanations, markdown formatting, or code blocks.
Start directly with 'classDiagram' and end with the last line of the diagram.
`

      console.log("Generating component diagram with AI...")

      try {
        // Use the AI service to generate the diagram
        const aiResult = await generateAIText(
          prompt,
          "You are an expert software architect who creates clear and accurate UML class diagrams using Mermaid syntax.",
          {
            provider,
            temperature: 0.7, // Use a slightly higher temperature for creativity
            apiKey: apiKey, // Explicitly pass the API key
          },
        )

        if (aiResult.success && aiResult.text) {
          // Clean up the AI response
          const cleanedCode = cleanMermaidCode(aiResult.text)
          setDiagramCode(cleanedCode)

          // Force re-render of the diagram
          setKey((prev) => prev + 1)

          toast({
            title: "Component diagram generated",
            description: "AI has generated a component diagram based on your specification",
          })
        } else {
          throw new Error(aiResult.error || "Failed to generate diagram with AI")
        }
      } catch (aiError) {
        console.error("AI generation error:", aiError)
        // Use a fallback diagram based on the app type
        setDiagramCode(DEFAULT_DIAGRAM)
        setKey((prev) => prev + 1)

        toast({
          title: "Using fallback diagram",
          description: "AI generation failed. Using a template instead.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error generating component diagram:", error)
      setPreviewError(error.message)

      // Use the default diagram as fallback
      setDiagramCode(DEFAULT_DIAGRAM)
      setKey((prev) => prev + 1)

      toast({
        title: "Using fallback diagram",
        description: "Failed to generate custom diagram. Using a template instead.",
        variant: "default",
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
    setAuthWarning(false)
    setSchemaWarning(null)
    setTempIdWarning(false)

    try {
      // Find the specification to get its name for the project
      const spec = specifications.find((s) => s.id === specificationId)
      const projectName = spec ? spec.app_name : "Unknown Project"

      console.log("Saving component diagram for project:", projectName)

      // Use the server action to create a requirement
      const requirementResult = await createRequirementForSpecification(specificationId, projectName)

      if (!requirementResult.success) {
        // Handle schema errors specifically
        if (
          requirementResult.error &&
          (requirementResult.error.includes("schema") ||
            requirementResult.error.includes("column") ||
            requirementResult.error.includes("database"))
        ) {
          setSchemaWarning(requirementResult.error)
          toast({
            title: "Database Schema Issue",
            description: "There was an issue with the database schema. We'll try to work around it.",
            variant: "default",
          })
          console.error("Schema error:", requirementResult.error)
          setIsSubmitting(false)
          return
        }

        throw new Error(requirementResult.error || "Failed to create requirement")
      }

      // Check if we're using a default user ID
      if (requirementResult.usingDefaultUser) {
        setAuthWarning(true)
        toast({
          title: "Using Default User ID",
          description: "No authentication session found. Using a default user ID for development.",
          variant: "default",
        })
      }

      // Now save the design using the server action
      const result = await saveComponentDiagram({
        type: "component",
        diagramCode,
        requirementId: requirementResult.requirementId,
      })

      if (result.success) {
        toast({
          title: "Component diagram saved",
          description: "Your component diagram has been saved successfully.",
        })

        // Check if we're using a default user ID
        if (result.usingDefaultUser) {
          setAuthWarning(true)
        }
      } else {
        if (result.error && (result.error.includes("column") || result.error.includes("schema"))) {
          // This is a schema error
          setSchemaWarning(result.error)
          toast({
            title: "Database Schema Error",
            description:
              "The designs table schema doesn't match what the code expects. We'll try to adapt automatically.",
            variant: "destructive",
          })
          console.error("Schema error:", result.error)
        } else {
          throw new Error(result.error || "Failed to save component diagram")
        }
      }
    } catch (error) {
      console.error("Error saving component diagram:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save component diagram.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle diagram code changes
  const handleDiagramCodeChange = (e) => {
    setDiagramCode(e.target.value)
    // Force re-render of the diagram
    setKey((prev) => prev + 1)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Component Diagram</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Use Mermaid class diagram syntax to define your application components. Select a specification and
              generate a diagram or create your own.
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

          {!apiKey && (
            <div className="mb-4 p-4 border border-amber-200 bg-amber-50 rounded-md flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-medium">OpenAI API Key Missing</p>
                <p className="text-sm">
                  Please add your OpenAI API key in the Settings page to use AI generation features.
                </p>
              </div>
            </div>
          )}

          {schemaWarning && (
            <div className="mb-4 p-4 border border-amber-200 bg-amber-50 rounded-md flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-medium">Database Schema Warning</p>
                <p className="text-sm">{schemaWarning}</p>
                <p className="text-sm mt-1">
                  There appears to be a mismatch between the code and the database schema. Please check your database
                  setup.
                </p>
              </div>
            </div>
          )}

          {tempIdWarning && (
            <div className="mb-4 p-4 border border-amber-200 bg-amber-50 rounded-md flex items-center gap-2 text-amber-700">
              <Info className="h-5 w-5" />
              <div>
                <p className="font-medium">Using Temporary Requirement ID</p>
                <p className="text-sm">
                  Unable to create a proper requirement in the database. Using a temporary ID instead. The diagram may
                  not be properly linked to a requirement.
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
                  No authentication session found. Using a default user ID for development purposes. In production, you
                  would need to be authenticated to save diagrams.
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
              disabled={isGenerating || !specificationId || !apiKey}
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
                onChange={handleDiagramCodeChange}
                className="font-mono text-sm h-[400px]"
                placeholder="Enter Mermaid class diagram code here or generate from a specification..."
              />
              <Button
                onClick={handleSave}
                disabled={isSubmitting || !specificationId || !diagramCode}
                className="mt-4 gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save Component Diagram"}
              </Button>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Preview:</div>
              <div className="border rounded-md p-4 h-[400px] overflow-auto bg-white">
                {diagramCode ? (
                  <MermaidDiagram key={key} code={diagramCode} className="h-full w-full" />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No diagram to preview. Generate or enter a diagram.
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
