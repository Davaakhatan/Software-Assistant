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
// Import the getSpecifications function from the specification-generator actions
import { getSpecifications, getSpecificationById } from "../specification-generator/actions"
// Import the client-side supabase instance
import { getSupabase } from "@/lib/supabase"

export default function ComponentDiagram() {
  const { toast } = useToast()
  const [diagramCode, setDiagramCode] = useState(`flowchart TD
   subgraph Frontend
     UI[User Interface]
     Auth[Auth Component]
     Forms[Form Components]
     Dashboard[Dashboard Component]
   end
   
   subgraph Backend
     API[API Layer]
     Services[Service Layer]
     DB[Data Access Layer]
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

  // Update to fetch specifications instead of requirements
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

  // Add a function to generate component diagram from specification
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
    try {
      // Get the specification details
      console.log("Fetching specification with ID:", specificationId)
      const result = await getSpecificationById(specificationId)

      if (!result.success) {
        throw new Error(result.error || "Failed to get specification details")
      }

      const specData = result.data
      console.log("Specification data received:", specData ? "yes" : "no")

      // Generate a component diagram based on the specification data
      let generatedDiagram = `flowchart TD\n`

      // Extract app name and type from specification
      const appName = specData.app_name || "Application"
      const appType = specData.app_type || "web"
      console.log(`Generating component diagram for ${appType} application: ${appName}`)

      // Add frontend components based on app type
      generatedDiagram += `subgraph "Frontend"\n`

      if (appType === "ecommerce") {
        generatedDiagram += `  UI[User Interface]\n  ProductList[Product Listing]\n  ProductDetail[Product Detail]\n  Cart[Shopping Cart]\n  Checkout[Checkout Process]\n  UserProfile[User Profile]\n`
      } else if (appType === "crm") {
        generatedDiagram += `  UI[User Interface]\n  Dashboard[Dashboard]\n  ContactList[Contact Management]\n  LeadList[Lead Management]\n  Calendar[Calendar]\n  Reports[Reports]\n`
      } else {
        generatedDiagram += `  UI[User Interface]\n  Auth[Authentication UI]\n  Dashboard[Dashboard]\n  Forms[Form Components]\n  UserProfile[User Profile]\n`
      }

      generatedDiagram += `end\n\n`

      // Add backend components
      generatedDiagram += `subgraph "Backend"\n`

      if (appType === "ecommerce") {
        generatedDiagram += `  API[API Gateway]\n  ProductService[Product Service]\n  CartService[Cart Service]\n  OrderService[Order Service]\n  PaymentService[Payment Service]\n  UserService[User Service]\n  DB[(Database)]\n`
      } else if (appType === "crm") {
        generatedDiagram += `  API[API Gateway]\n  ContactService[Contact Service]\n  LeadService[Lead Service]\n  CalendarService[Calendar Service]\n  ReportService[Report Service]\n  UserService[User Service]\n  DB[(Database)]\n`
      } else {
        generatedDiagram += `  API[API Gateway]\n  AuthService[Auth Service]\n  ContentService[Content Service]\n  UserService[User Service]\n  NotificationService[Notification Service]\n  DB[(Database)]\n`
      }

      generatedDiagram += `end\n\n`

      // Add connections between components
      if (appType === "ecommerce") {
        generatedDiagram += `UI --> ProductList\nUI --> ProductDetail\nUI --> Cart\nUI --> Checkout\nUI --> UserProfile\n\n`
        generatedDiagram += `ProductList --> API\nProductDetail --> API\nCart --> API\nCheckout --> API\nUserProfile --> API\n\n`
        generatedDiagram += `API --> ProductService\nAPI --> CartService\nAPI --> OrderService\nAPI --> PaymentService\nAPI --> UserService\n\n`
        generatedDiagram += `ProductService --> DB\nCartService --> DB\nOrderService --> DB\nPaymentService --> DB\nUserService --> DB\n`
      } else if (appType === "crm") {
        generatedDiagram += `UI --> Dashboard\nUI --> ContactList\nUI --> LeadList\nUI --> Calendar\nUI --> Reports\n\n`
        generatedDiagram += `Dashboard --> API\nContactList --> API\nLeadList --> API\nCalendar --> API\nReports --> API\n\n`
        generatedDiagram += `API --> ContactService\nAPI --> LeadService\nAPI --> CalendarService\nAPI --> ReportService\nAPI --> UserService\n\n`
        generatedDiagram += `ContactService --> DB\nLeadService --> DB\nCalendarService --> DB\nReportService --> DB\nUserService --> DB\n`
      } else {
        generatedDiagram += `UI --> Auth\nUI --> Dashboard\nUI --> Forms\nUI --> UserProfile\n\n`
        generatedDiagram += `Auth --> API\nDashboard --> API\nForms --> API\nUserProfile --> API\n\n`
        generatedDiagram += `API --> AuthService\nAPI --> ContentService\nAPI --> UserService\nAPI --> NotificationService\n\n`
        generatedDiagram += `AuthService --> DB\nContentService --> DB\nUserService --> DB\nNotificationService --> DB\n`
      }

      console.log("Generated component diagram successfully")
      setDiagramCode(generatedDiagram)

      toast({
        title: "Component diagram generated",
        description: "Component diagram has been generated based on the selected specification.",
      })
    } catch (error) {
      console.error("Error generating component diagram:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to generate component diagram",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Update the handleSave function to work with specifications
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
        type: "component",
        diagramCode,
        requirementId,
      })

      if (result.success) {
        toast({
          title: "Component diagram saved",
          description: "Your component diagram has been saved successfully.",
        })
      } else {
        throw new Error(result.error || "Failed to save component diagram")
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

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Component Interaction Diagram</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Use Mermaid flowchart syntax to define how your components interact with each other.
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
              onClick={generateComponentDiagram}
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
                {isSubmitting ? "Saving..." : "Save Component Diagram"}
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
