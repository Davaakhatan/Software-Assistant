"use client"

import { useState, useEffect } from "react"
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
      // Get the specification details
      const result = await getSpecificationById(specificationId)

      if (!result.success) {
        throw new Error(result.error || "Failed to get specification details")
      }

      const specData = result.data

      // First, try to extract a diagram from the specification if it exists
      const extractedDiagram = extractDiagramFromSpecification(specData)

      if (extractedDiagram) {
        setDiagramCode(extractedDiagram)
      } else {
        // Generate a diagram based on the specification data
        const generatedDiagram = generateDiagramFromSpecification(specData)
        setDiagramCode(generatedDiagram)
      }

      toast({
        title: "Data model generated",
        description: "Data model has been generated based on the selected specification.",
      })
    } catch (error) {
      console.error("Error generating data model:", error)
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

  // Function to generate a diagram based on the specification data
  const generateDiagramFromSpecification = (specData) => {
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

      // Cart class
      diagram += `  class Cart {\n`
      diagram += `    +String id\n`
      diagram += `    +String userId\n`
      diagram += `    +Date createdAt\n`
      diagram += `    +Date updatedAt\n`
      diagram += `  }\n\n`

      // CartItem class
      diagram += `  class CartItem {\n`
      diagram += `    +String id\n`
      diagram += `    +String cartId\n`
      diagram += `    +String productId\n`
      diagram += `    +Int quantity\n`
      diagram += `    +Date createdAt\n`
      diagram += `    +Date updatedAt\n`
      diagram += `  }\n\n`

      // Add relationships
      diagram += `  User "1" -- "1" Profile : has\n`
      diagram += `  User "1" -- "many" Order : places\n`
      diagram += `  User "1" -- "1" Cart : has\n`
      diagram += `  Cart "1" -- "many" CartItem : contains\n`
      diagram += `  CartItem "many" -- "1" Product : references\n`
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
      diagram += `    +String position\n`
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

      // Task class
      diagram += `  class Task {\n`
      diagram += `    +String id\n`
      diagram += `    +String userId\n`
      diagram += `    +String contactId\n`
      diagram += `    +String leadId\n`
      diagram += `    +String dealId\n`
      diagram += `    +String title\n`
      diagram += `    +String description\n`
      diagram += `    +String status\n`
      diagram += `    +Date dueDate\n`
      diagram += `    +Date createdAt\n`
      diagram += `    +Date updatedAt\n`
      diagram += `  }\n\n`

      // Add relationships
      diagram += `  User "1" -- "1" Profile : has\n`
      diagram += `  User "1" -- "many" Contact : manages\n`
      diagram += `  User "1" -- "many" Lead : manages\n`
      diagram += `  User "1" -- "many" Deal : manages\n`
      diagram += `  User "1" -- "many" Task : owns\n`
      diagram += `  Contact "1" -- "many" Lead : associated with\n`
      diagram += `  Lead "1" -- "many" Deal : converts to\n`
      diagram += `  Contact "1" -- "many" Task : has\n`
      diagram += `  Lead "1" -- "many" Task : has\n`
      diagram += `  Deal "1" -- "many" Task : has\n`
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

      // Media class
      diagram += `  class Media {\n`
      diagram += `    +String id\n`
      diagram += `    +String userId\n`
      diagram += `    +String name\n`
      diagram += `    +String type\n`
      diagram += `    +String url\n`
      diagram += `    +Int size\n`
      diagram += `    +Date createdAt\n`
      diagram += `    +Date updatedAt\n`
      diagram += `  }\n\n`

      // Add relationships
      diagram += `  User "1" -- "1" Profile : has\n`
      diagram += `  User "1" -- "many" Post : authors\n`
      diagram += `  User "1" -- "many" Comment : writes\n`
      diagram += `  User "1" -- "many" Media : uploads\n`
      diagram += `  Post "many" -- "many" Category : belongs to\n`
      diagram += `  Post "1" -- "many" Comment : has\n`
      diagram += `  Post "many" -- "many" Media : contains\n`
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

      // Notification class
      diagram += `  class Notification {\n`
      diagram += `    +String id\n`
      diagram += `    +String userId\n`
      diagram += `    +String title\n`
      diagram += `    +String message\n`
      diagram += `    +Boolean read\n`
      diagram += `    +Date createdAt\n`
      diagram += `    +Date updatedAt\n`
      diagram += `  }\n\n`

      // Add relationships
      diagram += `  User "1" -- "1" Profile : has\n`
      diagram += `  User "1" -- "many" Content : creates\n`
      diagram += `  User "1" -- "many" Settings : configures\n`
      diagram += `  User "1" -- "many" Notification : receives\n`
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
              Use Mermaid class diagram syntax to define your data model.
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
                {isSubmitting ? "Saving..." : "Save Data Model"}
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
