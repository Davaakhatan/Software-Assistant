"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Save, Wand2, Copy, Check, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import MermaidDiagram from "@/components/mermaid-diagram"
import { getSpecifications, getSpecificationById } from "../specification-generator/actions"
import { saveDesign } from "./actions"
import { useAIProvider } from "@/context/ai-provider-context"
import { generateDataModelDiagram } from "@/lib/openai-direct"

export default function DataModel() {
  const { toast } = useToast()
  const { provider, temperature } = useAIProvider()
const [diagramCode, setDiagramCode] = useState(`classDiagram
class Users {
  id       : int    (PK)
  name     : string
  email    : string
  password : string
}
class DetectedObjects {
  id          : int      (PK)
  user_id     : int      (FK)
  name        : string
  description : string
  image_url   : string
  timestamp   : datetime
}

Users "1" -- "0..*" DetectedObjects
`)
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

  useEffect(() => {
    // Check if API key exists
    const apiKey = localStorage.getItem("openai_api_key")
    setApiKeyMissing(!apiKey || !apiKey.startsWith("sk-"))

    const fetchSpecifications = async () => {
      try {
        setFetchError(null)
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

  // Convert traditional class diagram syntax to the simpler format
  const convertToSimpleSyntax = (code) => {
    if (!code) return ""

    // If it's already in the simple format, return as is
    if (!code.includes("{") && code.includes("class") && code.includes(":")) {
      // Just clean up any comments or special characters
      return cleanupDiagramCode(code)
    }

    // Normalize line breaks
    let result = code.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

    // Remove comments that are causing issues
    result = result.replace(/\s*%%.*$/gm, "")

    // Replace special characters in type definitions
    result = result.replace(/~/g, ".")

    // Ensure classDiagram is at the beginning
    if (!result.trim().startsWith("classDiagram")) {
      result = "classDiagram\n" + result
    }

    // Split into lines
    const lines = result.split("\n")
    const newLines = ["classDiagram"]

    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Skip empty lines and the classDiagram declaration
      if (!line || line === "classDiagram") continue

      // Handle class definitions with curly braces
      if (line.startsWith("class ") && line.includes("{")) {
        // Extract class name
        const className = line.substring(6, line.indexOf("{")).trim()
        newLines.push(`class ${className}`)

        // Process class properties
        let j = i + 1
        while (j < lines.length && !lines[j].includes("}")) {
          const propLine = lines[j].trim()

          // If it's a property line (starts with + or -)
          if (propLine.startsWith("+") || propLine.startsWith("-")) {
            const propName = propLine.substring(1).trim()
            newLines.push(`${className} : ${propName}`)
          }

          j++
        }

        // Skip to after the closing brace
        i = j
      }
      // Handle simple class declarations
      else if (line.startsWith("class ") && !line.includes("{")) {
        newLines.push(line)
      }
      // Handle relationships
      else if (line.includes("--")) {
        newLines.push(line)
      }
      // Handle class properties directly
      else if (line.includes(" : ")) {
        newLines.push(line)
      }
    }

    return newLines.join("\n")
  }

  // Add a new function to clean up diagram code
  const cleanupDiagramCode = (code) => {
    if (!code) return ""

    // Remove comments
    let cleaned = code.replace(/\s*%%.*$/gm, "")

    // Replace special characters
    cleaned = cleaned.replace(/~/g, ".")

    // Split into lines for better processing
    const lines = cleaned.split("\n")
    const newLines = []

    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Skip empty lines
      if (!line) continue

      // Keep class diagram declaration
      if (line === "classDiagram" || line === "erDiagram") {
        newLines.push(line)
        continue
      }

      // Handle class definitions and relationships
      if (line.startsWith("class ") || line.includes(" -- ")) {
        newLines.push(line)
      }
      // Handle class properties
      else if (line.includes(" : ")) {
        // Ensure there are no trailing comments or special characters
        const cleanedLine = line.split("%%")[0].trim()
        newLines.push(cleanedLine)
      }
      // Add other lines as is
      else {
        newLines.push(line)
      }
    }

    return newLines.join("\n")
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
    const apiKey = localStorage.getItem("openai_api_key")
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
      // Get the specification details
      const result = await getSpecificationById(specificationId)

      if (!result.success) {
        throw new Error(result.error || "Failed to get specification details")
      }

      const specData = result.data

      // Use the direct OpenAI implementation
      const directResult = await generateDataModelDiagram(
        specData.app_name || "Unknown",
        specData.app_type || "web",
        specData.app_description || "",
        specData.database_schema || "",
        {
          temperature,
          apiKey,
        },
      )

      if (directResult.success && directResult.diagram) {
        // Convert to simple syntax
        const simplifiedDiagram = convertToSimpleSyntax(directResult.diagram)

        const classMatch = simplifiedDiagram.match(/(classDiagram[\s\S]*)/i)
        let diagramCodeNew = ""
        if (classMatch && classMatch[1]) {
          diagramCodeNew = classMatch[1].trim()
        } else {
          const erMatch = simplifiedDiagram.match(/(erDiagram[\s\S]*)/i)
          if (erMatch && erMatch[1]) {
            diagramCodeNew = erMatch[1].trim()
          }
        }

        const mermaidMatch = diagramCodeNew.match(/```(?:mermaid)?\s*(classDiagram[\s\S]*?)```/m)

        setDiagramCode(simplifiedDiagram)

        toast({
          title: "Data model generated",
          description: "Data model has been generated using direct OpenAI API call.",
        })
      } else {
        // If direct method fails, use the default diagram
        console.log("Direct API method failed, using default diagram")
        const defaultDiagram = generateDefaultDiagram(specData)
        setDiagramCode(defaultDiagram)

        toast({
          title: "Using default diagram",
          description: "Could not generate custom diagram. Using default template.",
          variant: "warning",
        })
      }
    } catch (error) {
      console.error("Error generating data model:", error)
      setPreviewError(error.message)

      // If there's an error, fall back to the default diagram
      if (selectedSpecification) {
        const defaultDiagram = generateDefaultDiagram(selectedSpecification)
        setDiagramCode(defaultDiagram)

        toast({
          title: "Using default diagram",
          description: "Error generating custom diagram. Using default template.",
          variant: "warning",
        })
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to generate data model",
          variant: "destructive",
        })
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // Function to generate a default diagram based on the specification data
  const generateDefaultDiagram = (specData) => {
    const appName = specData.app_name || "Application"
    const appType = specData.app_type || "web"

    let diagram = `classDiagram\n`

    // Add User class for all app types
    diagram += `  class User\n`
    diagram += `  User : +String id\n`
    diagram += `  User : +String name\n`
    diagram += `  User : +String email\n`
    diagram += `  User : +String password\n`
    diagram += `  User : +Date createdAt\n`
    diagram += `  User : +Date updatedAt\n\n`

    // Add Profile class for all app types
    diagram += `  class Profile\n`
    diagram += `  Profile : +String id\n`
    diagram += `  Profile : +String userId\n`
    diagram += `  Profile : +String bio\n`
    diagram += `  Profile : +String avatar\n`
    diagram += `  Profile : +Date createdAt\n`
    diagram += `  Profile : +Date updatedAt\n\n`

    // Add app-specific classes based on app type
    if (appType === "ecommerce") {
      // Product class
      diagram += `  class Product\n`
      diagram += `  Product : +String id\n`
      diagram += `  Product : +String name\n`
      diagram += `  Product : +String description\n`
      diagram += `  Product : +Float price\n`
      diagram += `  Product : +Int stock\n`
      diagram += `  Product : +String[] images\n`
      diagram += `  Product : +String categoryId\n`
      diagram += `  Product : +Date createdAt\n`
      diagram += `  Product : +Date updatedAt\n\n`

      // Category class
      diagram += `  class Category\n`
      diagram += `  Category : +String id\n`
      diagram += `  Category : +String name\n`
      diagram += `  Category : +String description\n`
      diagram += `  Category : +String slug\n`
      diagram += `  Category : +Date createdAt\n`
      diagram += `  Category : +Date updatedAt\n\n`

      // Order class
      diagram += `  class Order\n`
      diagram += `  Order : +String id\n`
      diagram += `  Order : +String userId\n`
      diagram += `  Order : +Float total\n`
      diagram += `  Order : +String status\n`
      diagram += `  Order : +String shippingAddress\n`
      diagram += `  Order : +String paymentMethod\n`
      diagram += `  Order : +Date createdAt\n`
      diagram += `  Order : +Date updatedAt\n\n`

      // OrderItem class
      diagram += `  class OrderItem\n`
      diagram += `  OrderItem : +String id\n`
      diagram += `  OrderItem : +String orderId\n`
      diagram += `  OrderItem : +String productId\n`
      diagram += `  OrderItem : +Int quantity\n`
      diagram += `  OrderItem : +Float price\n`
      diagram += `  OrderItem : +Date createdAt\n`
      diagram += `  OrderItem : +Date updatedAt\n\n`

      // Add relationships
      diagram += `  User "1" -- "1" Profile : has\n`
      diagram += `  User "1" -- "many" Order : places\n`
      diagram += `  Order "1" -- "many" OrderItem : contains\n`
      diagram += `  OrderItem "many" -- "1" Product : references\n`
      diagram += `  Product "many" -- "1" Category : belongs to\n`
    } else if (appType === "crm") {
      // Contact class
      diagram += `  class Contact\n`
      diagram += `  Contact : +String id\n`
      diagram += `  Contact : +String userId\n`
      diagram += `  Contact : +String name\n`
      diagram += `  Contact : +String email\n`
      diagram += `  Contact : +String phone\n`
      diagram += `  Contact : +String company\n`
      diagram += `  Contact : +String status\n`
      diagram += `  Contact : +Date createdAt\n`
      diagram += `  Contact : +Date updatedAt\n\n`

      // Lead class
      diagram += `  class Lead\n`
      diagram += `  Lead : +String id\n`
      diagram += `  Lead : +String userId\n`
      diagram += `  Lead : +String contactId\n`
      diagram += `  Lead : +String name\n`
      diagram += `  Lead : +String source\n`
      diagram += `  Lead : +Float value\n`
      diagram += `  Lead : +String status\n`
      diagram += `  Lead : +Date createdAt\n`
      diagram += `  Lead : +Date updatedAt\n\n`

      // Deal class
      diagram += `  class Deal\n`
      diagram += `  Deal : +String id\n`
      diagram += `  Deal : +String userId\n`
      diagram += `  Deal : +String leadId\n`
      diagram += `  Deal : +String name\n`
      diagram += `  Deal : +Float value\n`
      diagram += `  Deal : +String stage\n`
      diagram += `  Deal : +Date closingDate\n`
      diagram += `  Deal : +Date createdAt\n`
      diagram += `  Deal : +Date updatedAt\n\n`

      // Add relationships
      diagram += `  User "1" -- "1" Profile : has\n`
      diagram += `  User "1" -- "many" Contact : manages\n`
      diagram += `  User "1" -- "many" Lead : manages\n`
      diagram += `  User "1" -- "many" Deal : manages\n`
      diagram += `  Contact "1" -- "many" Lead : associated with\n`
      diagram += `  Lead "1" -- "many" Deal : converts to\n`
    } else if (appType === "blog" || appType === "cms") {
      // Post class
      diagram += `  class Post\n`
      diagram += `  Post : +String id\n`
      diagram += `  Post : +String userId\n`
      diagram += `  Post : +String title\n`
      diagram += `  Post : +String content\n`
      diagram += `  Post : +String excerpt\n`
      diagram += `  Post : +String[] tags\n`
      diagram += `  Post : +String status\n`
      diagram += `  Post : +Date publishedAt\n`
      diagram += `  Post : +Date createdAt\n`
      diagram += `  Post : +Date updatedAt\n\n`

      // Category class
      diagram += `  class Category\n`
      diagram += `  Category : +String id\n`
      diagram += `  Category : +String name\n`
      diagram += `  Category : +String description\n`
      diagram += `  Category : +String slug\n`
      diagram += `  Category : +Date createdAt\n`
      diagram += `  Category : +Date updatedAt\n\n`

      // Comment class
      diagram += `  class Comment\n`
      diagram += `  Comment : +String id\n`
      diagram += `  Comment : +String postId\n`
      diagram += `  Comment : +String userId\n`
      diagram += `  Comment : +String content\n`
      diagram += `  Comment : +String status\n`
      diagram += `  Comment : +Date createdAt\n`
      diagram += `  Comment : +Date updatedAt\n\n`

      // Add relationships
      diagram += `  User "1" -- "1" Profile : has\n`
      diagram += `  User "1" -- "many" Post : authors\n`
      diagram += `  User "1" -- "many" Comment : writes\n`
      diagram += `  Post "many" -- "many" Category : belongs to\n`
      diagram += `  Post "1" -- "many" Comment : has\n`
    } else {
      // Generic classes for other app types
      // Content class
      diagram += `  class Content\n`
      diagram += `  Content : +String id\n`
      diagram += `  Content : +String userId\n`
      diagram += `  Content : +String title\n`
      diagram += `  Content : +String description\n`
      diagram += `  Content : +String type\n`
      diagram += `  Content : +String status\n`
      diagram += `  Content : +Date createdAt\n`
      diagram += `  Content : +Date updatedAt\n\n`

      // Settings class
      diagram += `  class Settings\n`
      diagram += `  Settings : +String id\n`
      diagram += `  Settings : +String userId\n`
      diagram += `  Settings : +String key\n`
      diagram += `  Settings : +String value\n`
      diagram += `  Settings : +Date createdAt\n`
      diagram += `  Settings : +Date updatedAt\n\n`

      // Add relationships
      diagram += `  User "1" -- "1" Profile : has\n`
      diagram += `  User "1" -- "many" Content : creates\n`
      diagram += `  User "1" -- "many" Settings : configures\n`
    }

    // Just ensure we clean up the final diagram
    return cleanupDiagramCode(diagram)
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
      console.log("Using project name:", projectName, "from specification:", spec)

      // Use the saveDesign server action directly with the specification ID
      // Explicitly set the type to "data-model" instead of "data"
      const result = await saveDesign({
        type: "data-model", // Changed from "data" to "data-model"
        diagramCode,
        specificationId, // Pass the specification ID directly
        projectName, // Pass the project name
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

                {selectedSpecification.database_schema && (
                  <div className="mt-3 border-t pt-3">
                    <p className="text-sm font-medium">Database Schema:</p>
                    <pre className="text-xs bg-black/5 p-2 rounded mt-1 overflow-auto max-h-40">
                      {selectedSpecification.database_schema}
                    </pre>
                  </div>
                )}
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
                <MermaidDiagram code={diagramCode} className="h-full w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
