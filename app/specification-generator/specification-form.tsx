"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, FileText, Save, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SpecificationForm() {
  const { toast } = useToast()
  const [appName, setAppName] = useState("")
  const [appDescription, setAppDescription] = useState("")
  const [appType, setAppType] = useState("web")
  const [targetAudience, setTargetAudience] = useState("")
  const [keyFeatures, setKeyFeatures] = useState("")
  const [technicalConstraints, setTechnicalConstraints] = useState("")
  const [includeItems, setIncludeItems] = useState({
    functionalRequirements: true,
    nonFunctionalRequirements: true,
    systemArchitecture: true,
    apiDesign: true,
    databaseSchema: true,
    scalabilityConsiderations: true,
    securityConsiderations: true,
    deploymentPlan: true,
    monitoringLogging: true,
    futureEnhancements: true,
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("input")
  const [generatedSpec, setGeneratedSpec] = useState({
    functionalRequirements: "",
    nonFunctionalRequirements: "",
    systemArchitecture: "",
    apiDesign: "",
    databaseSchema: "",
    scalabilityConsiderations: "",
    securityConsiderations: "",
    deploymentPlan: "",
    monitoringLogging: "",
    futureEnhancements: "",
  })

  const handleIncludeItemChange = (item, checked) => {
    setIncludeItems({
      ...includeItems,
      [item]: checked,
    })
  }

  const handleGenerate = async () => {
    toast({
      title: "Not implemented",
      description: "This feature is not implemented yet.",
    })
  }

  const handleSave = async () => {
    toast({
      title: "Not implemented",
      description: "This feature is not implemented yet.",
    })
  }

  const handleDownload = () => {
    toast({
      title: "Not implemented",
      description: "This feature is not implemented yet.",
    })
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="input">Application Details</TabsTrigger>
          <TabsTrigger value="output">Generated Specification</TabsTrigger>
        </TabsList>
        <TabsContent value="input" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Information</CardTitle>
              <CardDescription>Provide details about the application you want to build</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="app-name">Application Name</Label>
                  <Input
                    id="app-name"
                    placeholder="e.g., Task Manager Pro"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app-type">Application Type</Label>
                  <Select value={appType} onValueChange={setAppType}>
                    <SelectTrigger id="app-type">
                      <SelectValue placeholder="Select application type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web">Web Application</SelectItem>
                      <SelectItem value="mobile">Mobile Application</SelectItem>
                      <SelectItem value="desktop">Desktop Application</SelectItem>
                      <SelectItem value="saas">SaaS Platform</SelectItem>
                      <SelectItem value="ecommerce">E-Commerce</SelectItem>
                      <SelectItem value="crm">CRM System</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="app-description">Application Description</Label>
                <Textarea
                  id="app-description"
                  placeholder="Describe the purpose and main functionality of your application..."
                  rows={4}
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-audience">Target Audience</Label>
                <Textarea
                  id="target-audience"
                  placeholder="Describe who will use your application..."
                  rows={2}
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key-features">Key Features</Label>
                <Textarea
                  id="key-features"
                  placeholder="List the main features you want in your application..."
                  rows={4}
                  value={keyFeatures}
                  onChange={(e) => setKeyFeatures(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="technical-constraints">Technical Constraints or Preferences</Label>
                <Textarea
                  id="technical-constraints"
                  placeholder="Any specific technologies, platforms, or constraints to consider..."
                  rows={2}
                  value={technicalConstraints}
                  onChange={(e) => setTechnicalConstraints(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <Label>Include in Specification</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-functional"
                      checked={includeItems.functionalRequirements}
                      onCheckedChange={(checked) => handleIncludeItemChange("functionalRequirements", checked)}
                    />
                    <Label htmlFor="include-functional" className="text-sm font-normal">
                      Functional Requirements
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-non-functional"
                      checked={includeItems.nonFunctionalRequirements}
                      onCheckedChange={(checked) => handleIncludeItemChange("nonFunctionalRequirements", checked)}
                    />
                    <Label htmlFor="include-non-functional" className="text-sm font-normal">
                      Non-Functional Requirements
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-architecture"
                      checked={includeItems.systemArchitecture}
                      onCheckedChange={(checked) => handleIncludeItemChange("systemArchitecture", checked)}
                    />
                    <Label htmlFor="include-architecture" className="text-sm font-normal">
                      System Architecture
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-api"
                      checked={includeItems.apiDesign}
                      onCheckedChange={(checked) => handleIncludeItemChange("apiDesign", checked)}
                    />
                    <Label htmlFor="include-api" className="text-sm font-normal">
                      API Design
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-database"
                      checked={includeItems.databaseSchema}
                      onCheckedChange={(checked) => handleIncludeItemChange("databaseSchema", checked)}
                    />
                    <Label htmlFor="include-database" className="text-sm font-normal">
                      Database Schema
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-scalability"
                      checked={includeItems.scalabilityConsiderations}
                      onCheckedChange={(checked) => handleIncludeItemChange("scalabilityConsiderations", checked)}
                    />
                    <Label htmlFor="include-scalability" className="text-sm font-normal">
                      Scalability & Performance
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-security"
                      checked={includeItems.securityConsiderations}
                      onCheckedChange={(checked) => handleIncludeItemChange("securityConsiderations", checked)}
                    />
                    <Label htmlFor="include-security" className="text-sm font-normal">
                      Security Considerations
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-deployment"
                      checked={includeItems.deploymentPlan}
                      onCheckedChange={(checked) => handleIncludeItemChange("deploymentPlan", checked)}
                    />
                    <Label htmlFor="include-deployment" className="text-sm font-normal">
                      Deployment Plan
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-monitoring"
                      checked={includeItems.monitoringLogging}
                      onCheckedChange={(checked) => handleIncludeItemChange("monitoringLogging", checked)}
                    />
                    <Label htmlFor="include-monitoring" className="text-sm font-normal">
                      Monitoring & Logging
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-future"
                      checked={includeItems.futureEnhancements}
                      onCheckedChange={(checked) => handleIncludeItemChange("futureEnhancements", checked)}
                    />
                    <Label htmlFor="include-future" className="text-sm font-normal">
                      Future Enhancements
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
                <Sparkles className="h-4 w-4" />
                {isGenerating ? "Generating..." : "Generate Specification"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="output" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Generated Specification</CardTitle>
              <CardDescription>Review and save your system specification</CardDescription>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Generating system specification...</p>
                  </div>
                </div>
              ) : (
                <div className="text-center p-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <p>
                    No specification generated yet. Fill in your application details and click "Generate Specification".
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("input")} className="gap-2">
                Edit Details
              </Button>
              <Button onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Specification"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
