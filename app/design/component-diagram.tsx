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
import { createRequirementForSpecification, saveComponentDiagram } from "./component-diagram-actions"

export default function ComponentDiagram() {
  const { toast } = useToast()
  const [diagramCode, setDiagramCode] = useState(`flowchart TD
  subgraph Frontend
    UI["User Interface"]
    Auth["Auth Component"]
    Forms["Form Components"]
    Dashboard["Dashboard Component"]
  end
  
  subgraph Backend
    API["API Layer"]
    Services["Service Layer"]
    DB["Data Access Layer"]
  end
  
  UI --> Auth
  UI --> Forms
  UI --> Dashboard
  
  Auth --> API
  Forms --> API
  Dashboard --> API
  
  API --> Services
  Services --> DB`)
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

  // Function to format a diagram with proper line breaks and spacing
  const formatDiagram = (code) => {
    if (!code) return ""

    // First, normalize line breaks to ensure consistent processing
    let formatted = code.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

    // Fix the specific issue with "endsubgraph"
    formatted = formatted.replace(/endsubgraph/g, "end\nsubgraph")

    // Ensure 'end' is always on its own line
    formatted = formatted.replace(/(\S+)\s*end(\s|$)/g, "$1\nend$2")
    formatted = formatted.replace(/end\s*(\S+)/g, "end\n$1")

    // Split into lines and process each line
    const lines = formatted
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    // Start with an empty diagram
    let result = ""

    // Process the first line (graph/flowchart declaration)
    if (lines.length > 0) {
      const firstLine = lines[0]

      // Extract the graph type (graph LR, graph TD, flowchart TD, etc.)
      if (firstLine.startsWith("graph") || firstLine.startsWith("flowchart")) {
        // Extract the graph type and direction
        const match = firstLine.match(/(graph|flowchart)\s*([A-Z]{2})/)
        if (match) {
          const [, type, direction] = match
          result = `${type} ${direction}\n`
        } else {
          // If we can't parse it, just use the first line as is
          result = `${firstLine}\n`
        }
      } else {
        // If the first line doesn't start with graph or flowchart, assume it's flowchart TD
        result = `flowchart TD\n${firstLine}\n`
      }

      // Process the remaining lines
      for (let i = 1; i < lines.length; i++) {
        let line = lines[i].trim()

        // Handle comments - ensure they're on their own line
        if (line.includes("%%")) {
          const parts = line.split("%%")
          if (parts[0].trim()) {
            result += `${parts[0].trim()}\n`
          }
          if (parts[1].trim()) {
            result += `%% ${parts[1].trim()}\n`
          }
          continue
        }

        // Handle subgraph declarations
        if (line.startsWith("subgraph")) {
          // Extract the subgraph title
          const titleMatch = line.match(/subgraph\s+(.+)/)
          if (titleMatch) {
            const title = titleMatch[1]
            // If the title is not already quoted and contains spaces, quote it
            if (title.includes(" ") && !title.startsWith('"') && !title.endsWith('"')) {
              result += `subgraph "${title}"\n`
            } else {
              result += `${line}\n`
            }
          } else {
            result += `${line}\n`
          }
        }
        // Handle end statements
        else if (line === "end") {
          result += `end\n`
        }
        // Handle node definitions and connections
        else {
          // Fix node text with spaces
          line = line.replace(/\[([^\]]*)\]/g, (match, p1) => {
            if (/[\s$[\]/\\:;,]/.test(p1) && !p1.includes('"')) {
              return `["${p1}"]`
            }
            return match
          })

          // Fix parentheses in node text
          line = line.replace(/\[([^\]]*$[^)]*$[^\]]*)\]/g, (match) => {
            return match.replace(/$/g, "&#40;").replace(/$/g, "&#41;")
          })

          // Ensure proper spacing around arrows
          line = line.replace(/([A-Za-z0-9_")])(\s*)-->/g, "$1 -->")
          line = line.replace(/-->(\s*)([A-Za-z0-9_"(])/g, "--> $2")

          result += `${line}\n`
        }
      }
    } else {
      // If there are no lines, return a basic flowchart
      result = "graph TD\n  A[Start] --> B[End]\n"
    }

    // Final check for any remaining "endsubgraph" issues
    result = result.replace(/endsubgraph/g, "end\nsubgraph")

    return result
  }

  // Add a function to generate component diagram from specification using AI
  const generateComponentDiagram = async () => {
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
      console.log("Fetching specification with ID:", specificationId)
      const result = await getSpecificationById(specificationId)

      if (!result.success) {
        throw new Error(result.error || "Failed to get specification details")
      }

      const specData = result.data
      console.log("Specification data received:", specData ? "yes" : "no")

      // First try to extract a component diagram from the specification if it exists
      const extractedDiagram = extractDiagramFromSpecification(specData)

      if (extractedDiagram) {
        const formattedDiagram = formatDiagram(extractedDiagram)
        setDiagramCode(formattedDiagram)
        toast({
          title: "Component diagram extracted",
          description: "Component diagram was extracted from the specification",
        })
      } else {
        // Generate a component diagram based on the specification data using AI
        const generatedDiagram = await generateDiagramWithAI(specData)
        const formattedDiagram = formatDiagram(generatedDiagram)
        setDiagramCode(formattedDiagram)
        toast({
          title: "Component diagram generated",
          description: "Component diagram has been generated based on the selected specification",
        })
      }
    } catch (error) {
      console.error("Error generating component diagram:", error)
      setPreviewError(error.message)
      toast({
        title: "Error",
        description: error.message || "Failed to generate component diagram",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Function to extract a diagram from the specification text
  const extractDiagramFromSpecification = (specData) => {
    // Look for mermaid diagram in system_architecture section that might contain component info
    if (specData.system_architecture) {
      // Try to find a mermaid diagram in the system_architecture field
      const mermaidMatch = specData.system_architecture.match(/```mermaid\s*([\s\S]*?)\s*```/)
      if (mermaidMatch && mermaidMatch[1]) {
        const diagramContent = mermaidMatch[1].trim()
        // Check if it's a flowchart or component diagram
        if (
          diagramContent.includes("flowchart") ||
          diagramContent.includes("graph") ||
          diagramContent.includes("subgraph")
        ) {
          return diagramContent
        }
      }

      // Try to find a flowchart pattern without mermaid markers
      const flowchartMatch = specData.system_architecture.match(/flowchart\s+[A-Z]+\s*([\s\S]*?)(?:\n\n|\n$|$)/)
      if (flowchartMatch && flowchartMatch[0]) {
        return flowchartMatch[0].trim()
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
      // Check if it's a component diagram (contains flowchart or graph)
      const diagramContent = mermaidMatch[1].trim()
      if (
        diagramContent.includes("flowchart") ||
        diagramContent.includes("graph") ||
        diagramContent.includes("subgraph")
      ) {
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
Generate a Mermaid diagram for the component interaction of the following application:

App Name: ${specData.app_name || "Unknown"}
App Type: ${specData.app_type || "web"}
Description: ${specData.app_description || ""}

${specData.system_architecture ? `System Architecture Description: ${specData.system_architecture}` : ""}
${specData.functional_requirements ? `Functional Requirements: ${specData.functional_requirements}` : ""}

Please generate a Mermaid diagram using the 'flowchart TD' syntax that shows the component interactions.
Include frontend components, backend components, and how they interact with each other.
Use subgraphs to group related components.

IMPORTANT FORMATTING RULES:
1. Start with "flowchart TD" on its own line
2. Put each subgraph declaration on its own line
3. Enclose subgraph names in quotes, especially if they contain spaces or special characters
4. Enclose node text in quotes if it contains spaces or special characters
5. Put each node and connection on its own line
6. End each subgraph with "end" on its own line - MAKE SURE "end" IS ON ITS OWN LINE
7. Use proper spacing around arrows (e.g., "A --> B" not "A-->B")
8. Put comments on their own lines, not at the end of other lines
9. NEVER use "endsubgraph" - always use "end" on its own line
10. For multiple connections, use separate lines (e.g., "A --> B" and "B --> C" not "A --> B --> C")

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
      const mermaidMatch = diagramCode.match(/```(?:mermaid)?\s*(flowchart[\s\S]*?)```/)
      if (mermaidMatch && mermaidMatch[1]) {
        diagramCode = mermaidMatch[1].trim()
      } else {
        // If no mermaid code block found, look for flowchart or graph
        const flowchartMatch = diagramCode.match(/(flowchart\s+(?:TD|LR)[\s\S]*?)(?:\n\n|\n$|$)/)
        if (flowchartMatch && flowchartMatch[1]) {
          diagramCode = flowchartMatch[1].trim()
        } else {
          const graphMatch = diagramCode.match(/(graph\s+(?:TD|LR)[\s\S]*?)(?:\n\n|\n$|$)/)
          if (graphMatch && graphMatch[1]) {
            diagramCode = graphMatch[1].trim()
          }
        }
      }

      // If we still don't have a valid diagram, generate a default one
      if (!diagramCode.includes("flowchart") && !diagramCode.includes("graph")) {
        return generateDefaultDiagram(specData)
      }

      // Fix any "endsubgraph" issues before returning
      diagramCode = diagramCode.replace(/endsubgraph/g, "end\nsubgraph")

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
      } else {
        if (result.error && result.error.includes("not authenticated")) {
          setAuthWarning(true)
          toast({
            title: "Authentication Notice",
            description: "Using development mode for saving. In production, authentication would be required.",
            variant: "default",
          })
        } else {
          throw new Error(result.error || "Failed to save component diagram")
        }
      }
    } catch (error) {
      console.error("Error saving component diagram:", error)

      // Check if it's an authentication error
      if (error.message && error.message.includes("not authenticated")) {
        setAuthWarning(true)
        toast({
          title: "Authentication Notice",
          description: "Using development mode for saving. In production, authentication would be required.",
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to save component diagram.",
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
            <h2 className="text-xl font-semibold mb-2">Component Interaction Diagram</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Use Mermaid flowchart syntax to define how your components interact with each other. Select a
              specification and generate a diagram or create your own.
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
          </div>

          <div className="flex justify-end mb-4 gap-2">
            <Button variant="outline" onClick={copyToClipboard} className="gap-2" disabled={!diagramCode}>
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {isCopied ? "Copied" : "Copy"}
            </Button>
            <Button
              variant="outline"
              onClick={generateComponentDiagram}
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
                {isSubmitting ? "Saving..." : "Save Component Diagram"}
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Update the generateDefaultDiagram function to ensure proper formatting
const generateDefaultDiagram = (specData) => {
  const appName = specData.app_name || "Application"
  const appType = specData.app_type || "web"
  console.log(`Generating component diagram for ${appType} application: ${appName}`)

  let generatedDiagram = `flowchart TD\n`

  // Add frontend components based on app type
  generatedDiagram += `  subgraph "Frontend"\n`

  if (appType === "ecommerce") {
    generatedDiagram += `    UI["User Interface"]\n    ProductList["Product Listing"]\n    ProductDetail["Product Detail"]\n    Cart["Shopping Cart"]\n    Checkout["Checkout Process"]\n    UserProfile["User Profile"]\n`
  } else if (appType === "crm") {
    generatedDiagram += `    UI["User Interface"]\n    Dashboard["Dashboard"]\n    ContactList["Contact Management"]\n    LeadList["Lead Management"]\n    Calendar["Calendar"]\n    Reports["Reports"]\n`
  } else if (appType === "mobile") {
    generatedDiagram += `    UI["Mobile UI"]\n    Navigation["Navigation"]\n    Screens["App Screens"]\n    StateManager["State Management"]\n    LocalStorage["Local Storage"]\n    Notifications["Push Notifications"]\n`
  } else {
    generatedDiagram += `    UI["User Interface"]\n    Auth["Authentication UI"]\n    Dashboard["Dashboard"]\n    Forms["Form Components"]\n    UserProfile["User Profile"]\n`
  }

  generatedDiagram += `  end\n\n`

  // Add backend components
  generatedDiagram += `  subgraph "Backend"\n`

  if (appType === "ecommerce") {
    generatedDiagram += `    API["API Gateway"]\n    ProductService["Product Service"]\n    CartService["Cart Service"]\n    OrderService["Order Service"]\n    PaymentService["Payment Service"]\n    UserService["User Service"]\n    DB["Database"]\n`
  } else if (appType === "crm") {
    generatedDiagram += `    API["API Gateway"]\n    ContactService["Contact Service"]\n    LeadService["Lead Service"]\n    CalendarService["Calendar Service"]\n    ReportService["Report Service"]\n    UserService["User Service"]\n    DB["Database"]\n`
  } else if (appType === "mobile") {
    generatedDiagram += `    API["API Gateway"]\n    AuthService["Auth Service"]\n    DataService["Data Service"]\n    SyncService["Sync Service"]\n    NotificationService["Notification Service"]\n    DB["Database"]\n`
  } else {
    generatedDiagram += `    API["API Gateway"]\n    AuthService["Auth Service"]\n    ContentService["Content Service"]\n    UserService["User Service"]\n    NotificationService["Notification Service"]\n    DB["Database"]\n`
  }

  generatedDiagram += `  end\n\n`

  // Add connections between components
  if (appType === "ecommerce") {
    generatedDiagram += `  UI --> ProductList\n  UI --> ProductDetail\n  UI --> Cart\n  UI --> Checkout\n  UI --> UserProfile\n\n`
    generatedDiagram += `  ProductList --> API\n  ProductDetail --> API\n  Cart --> API\n  Checkout --> API\n  UserProfile --> API\n\n`
    generatedDiagram += `  API --> ProductService\n  API --> CartService\n  API --> OrderService\n  API --> PaymentService\n  UserService --> DB\n\n`
    generatedDiagram += `  ProductService --> DB\n  CartService --> DB\n  OrderService --> DB\n  PaymentService --> DB\n  UserService --> DB\n`
  } else if (appType === "crm") {
    generatedDiagram += `  UI --> Dashboard\n  UI --> ContactList\n  UI --> LeadList\n  UI --> Calendar\n  UI --> Reports\n\n`
    generatedDiagram += `  Dashboard --> API\n  ContactList --> API\n  LeadList --> API\n  Calendar --> API\n  Reports --> API\n\n`
    generatedDiagram += `  API --> ContactService\n  API --> LeadService\n  API --> CalendarService\n  ReportService --> API\n  UserService --> DB\n\n`
    generatedDiagram += `  ContactService --> DB\n  LeadService --> DB\n  CalendarService --> DB\n  ReportService --> DB\n  UserService --> DB\n`
  } else if (appType === "mobile") {
    generatedDiagram += `  UI --> Navigation\n  Navigation --> Screens\n  Screens --> StateManager\n  StateManager --> LocalStorage\n  StateManager --> API\n\n`
    generatedDiagram += `  API --> AuthService\n  API --> DataService\n  API --> SyncService\n  API --> NotificationService\n\n`
    generatedDiagram += `  AuthService --> DB\n  DataService --> DB\n  SyncService --> DB\n  NotificationService --> DB\n`
  } else {
    generatedDiagram += `  UI --> Auth\n  UI --> Dashboard\n  UI --> Forms\n  UserProfile --> API\n\n`
    generatedDiagram += `  Auth --> API\n  Dashboard --> API\n  Forms --> API\n  UserProfile --> API\n\n`
    generatedDiagram += `  API --> AuthService\n  API --> ContentService\n  API --> UserService\n  API --> NotificationService\n\n`
    generatedDiagram += `  AuthService --> DB\n  ContentService --> DB\n  UserService --> DB\n  NotificationService --> DB\n`
  }

  console.log("Generated component diagram successfully")
  return generatedDiagram
}

function formatDiagram(diagramCode) {
  // Trim leading/trailing whitespace
  diagramCode = diagramCode.trim()

  // Ensure the diagram starts with "graph LR" or "graph TD"
  if (
    !diagramCode.startsWith("graph LR") &&
    !diagramCode.startsWith("graph TD") &&
    !diagramCode.startsWith("flowchart TD")
  ) {
    diagramCode = "flowchart TD\n" + diagramCode
  }

  // Add a newline after each subgraph and connection
  diagramCode = diagramCode.replace(/(subgraph|-->)/g, "$1\n")

  // Remove extra newlines
  diagramCode = diagramCode.replace(/\n+/g, "\n")

  return diagramCode
}
