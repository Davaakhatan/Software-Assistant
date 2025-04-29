"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Save, Wand2, Copy, Check, RefreshCw, AlertTriangle, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import dynamic from "next/dynamic"
import { getSpecifications, getSpecificationById } from "../specification-generator/actions"
import { createRequirementForSpecification, saveSystemArchitecture } from "./system-architecture-actions"
import { useAIProvider } from "@/context/ai-provider-context"
import { generateAIText } from "@/lib/ai-service"

// Dynamically import the MermaidDiagram component with no SSR
const MermaidDiagram = dynamic(() => import("@/components/mermaid-diagram-architecture"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[400px] bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  ),
})

// Default diagrams for different application types
const DEFAULT_DIAGRAMS = {
  web: `graph TD
  subgraph Frontend
    A[Web Browser]
    B[ReactJS App]
  end
  
  subgraph Backend
    C[API Gateway]
    D[Node.js Server]
    E[Authentication Service]
  end
  
  subgraph Data_Storage
    F[SQL Database]
    G[Cache]
  end
  
  A --> B
  B --> C
  C --> D
  C --> E
  D --> F
  D --> G
  E --> F`,
  mobile: `graph TD
  subgraph Client
    A[Mobile App]
    B[Local Storage]
  end
  
  subgraph Backend
    C[API Gateway]
    D[Application Server]
    E[Auth Service]
  end
  
  subgraph Data_Layer
    F[Database]
    G[CDN]
  end
  
  A --> B
  A --> C
  C --> D
  C --> E
  D --> F
  D --> G
  E --> F`,
  ecommerce: `graph TD
  subgraph Frontend
    A[Web Browser]
    B[Mobile App]
  end
  
  subgraph Backend
    C[API Gateway]
    D[Product Service]
    E[Order Service]
    F[Payment Service]
    G[User Service]
  end
  
  subgraph Data_Storage
    H[Product DB]
    I[Order DB]
    J[User DB]
    K[Cache]
  end
  
  A --> C
  B --> C
  C --> D
  C --> E
  C --> F
  C --> G
  D --> H
  E --> I
  G --> J
  D --> K
  E --> K`,
}

export default function SystemArchitecture() {
  const { toast } = useToast()
  const { provider, temperature } = useAIProvider()

  const [diagramCode, setDiagramCode] = useState(DEFAULT_DIAGRAMS.web)
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
  const [apiKeyMissing, setApiKeyMissing] = useState(false)
  const [apiKey, setApiKey] = useState("") // Store API key

  useEffect(() => {
    // Check if API key exists and load it
    if (typeof window !== "undefined") {
      const storedApiKey = localStorage.getItem("openai_api_key")
      setApiKey(storedApiKey || "")
      setApiKeyMissing(!storedApiKey || !storedApiKey.startsWith("sk-"))
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

          // Set a default diagram based on the app type
          if (result.data.app_type) {
            const appType = result.data.app_type.toLowerCase()
            if (appType.includes("mobile")) {
              setDiagramCode(DEFAULT_DIAGRAMS.mobile)
            } else if (appType.includes("ecommerce") || appType.includes("e-commerce")) {
              setDiagramCode(DEFAULT_DIAGRAMS.ecommerce)
            } else {
              setDiagramCode(DEFAULT_DIAGRAMS.web)
            }
          }
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

    // Check if API key exists
    if (!apiKey || !apiKey.startsWith("sk-")) {
      setApiKeyMissing(true)
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
      let prompt = `
Generate a detailed Mermaid diagram for the system architecture of the following application:

App Name: ${specData.app_name || "Unknown"}
App Type: ${specData.app_type || "web"}
Description: ${specData.app_description || ""}
`

      // Include the system architecture description if available
      if (specData.system_architecture) {
        prompt += `
System Architecture Description:
${specData.system_architecture}
`
      }

      prompt += `
Consider the following aspects when generating the diagram:
- Key components and their responsibilities
- Interactions between components
- Data flow and storage
- External dependencies and integrations
- Scalability and performance considerations
- Security aspects

Requirements:
1. Use the 'graph TD' syntax for the Mermaid diagram
2. Include appropriate components based on the app type (${specData.app_type || "web"}). For example, for a web application, include components like:
   - Frontend (Web Browser, ReactJS App)
   - Backend (API Gateway, Node.js Server, Authentication Service)
   - Data Storage (SQL Database, NoSQL Database, Cache)
3. Show connections between components with arrows (-->) and label them with the type of interaction (e.g., HTTP, REST API, Database Query)
4. Use subgraphs to organize related components
5. Use simple node names like A, B, C with descriptive labels in square brackets
6. Ensure proper spacing and formatting
7. Include at least 10 components to show a complex architecture

Your response should ONLY contain the Mermaid diagram code, nothing else.
Do not include any explanations, markdown formatting, or code blocks.
Start directly with 'graph TD' and end with the last line of the diagram.
`

      console.log("Generating system architecture with AI...")

      try {
        // Use the API route to generate the diagram
        const aiResult = await generateAIText(
          prompt,
          "You are an expert system architect who creates clear and accurate Mermaid diagrams.",
          {
            provider,
            temperature: 0.7, // Use a slightly higher temperature for creativity
            apiKey: apiKey, // Pass the API key from localStorage
          },
        )

        if (aiResult.success && aiResult.text) {
          setDiagramCode(aiResult.text)
          toast({
            title: "System architecture generated",
            description: "AI has generated a system architecture based on your specification",
          })
        } else {
          throw new Error(aiResult.error || "Failed to generate diagram with AI")
        }
      } catch (apiError) {
        console.error("API error:", apiError)

        // Generate a simple diagram based on the app type as a fallback
        let fallbackDiagram = DEFAULT_DIAGRAMS.web

        if (specData.app_type?.toLowerCase().includes("mobile")) {
          fallbackDiagram = DEFAULT_DIAGRAMS.mobile
        } else if (
          specData.app_type?.toLowerCase().includes("ecommerce") ||
          specData.app_type?.toLowerCase().includes("e-commerce")
        ) {
          fallbackDiagram = DEFAULT_DIAGRAMS.ecommerce
        } else {
          fallbackDiagram = DEFAULT_DIAGRAMS.web
        }

        setDiagramCode(fallbackDiagram)
        toast({
          title: "Using template diagram",
          description: "AI generation failed. Using a template instead.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error generating system architecture:", error)

      // Use a default diagram as fallback
      if (selectedSpecification?.app_type) {
        const appType = selectedSpecification.app_type.toLowerCase()
        if (appType.includes("mobile")) {
          setDiagramCode(DEFAULT_DIAGRAMS.mobile)
        } else if (appType.includes("ecommerce") || appType.includes("e-commerce")) {
          setDiagramCode(DEFAULT_DIAGRAMS.ecommerce)
        } else {
          setDiagramCode(DEFAULT_DIAGRAMS.web)
        }
      } else {
        setDiagramCode(DEFAULT_DIAGRAMS.web)
      }

      toast({
        title: "Using template diagram",
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
    try {
      // Find the specification to get its name for the project
      const spec = specifications.find((s) => s.id === specificationId)
      const projectName = spec ? spec.app_name : "Unknown Project"

      console.log("Saving system architecture for project:", projectName)

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
        if (result.error && result.error.includes("not authenticated")) {
          setAuthWarning(true)
          toast({
            title: "Authentication Notice",
            description: "Using development mode for saving. In production, authentication would be required.",
            variant: "default",
          })
        } else if (result.error && (result.error.includes("column") || result.error.includes("schema"))) {
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
          throw new Error(result.error || "Failed to save system architecture")
        }
      }
    } catch (error) {
      console.error("Error saving system architecture:", error)

      // Check if this is an authentication error
      if (error.message && error.message.includes("not authenticated")) {
        setAuthWarning(true)
        toast({
          title: "Authentication Notice",
          description: "Using development mode for saving. In production, authentication would be required.",
          variant: "default",
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

          {apiKeyMissing && (
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

          {authWarning && (
            <div className="mb-4 p-4 border border-amber-200 bg-amber-50 rounded-md flex items-center gap-2 text-amber-700">
              <Info className="h-5 w-5" />
              <div>
                <p className="font-medium">Development Mode</p>
                <p className="text-sm">
                  You are not currently authenticated. In development mode, diagrams will be saved with a default user
                  ID.
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
            {selectedSpecification?.system_architecture && (
              <div className="mt-2 p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">System Architecture: {selectedSpecification.system_architecture}</p>
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
              disabled={isGenerating || !specificationId || apiKeyMissing}
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
                <MermaidDiagram code={diagramCode} className="h-full w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
