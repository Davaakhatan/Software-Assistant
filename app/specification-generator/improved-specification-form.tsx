"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { FileText, Save, Sparkles, Plus, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { saveSpecificationImproved, getProjectsList, getSpecificationTypes } from "./improved-actions"

export function ImprovedSpecificationForm() {
  const { toast } = useToast()
  const [appName, setAppName] = useState("")
  const [appDescription, setAppDescription] = useState("")
  const [appType, setAppType] = useState("web")
  const [targetAudience, setTargetAudience] = useState("")
  const [keyFeatures, setKeyFeatures] = useState("")
  const [technicalConstraints, setTechnicalConstraints] = useState("")
  const [complexity, setComplexity] = useState("medium")
  const [projectId, setProjectId] = useState("")
  const [version, setVersion] = useState("1.0")
  const [status, setStatus] = useState("draft")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")

  const [includeItems, setIncludeItems] = useState({
    functional_requirements: true,
    non_functional_requirements: true,
    system_architecture: true,
    api_design: true,
    database_schema: true,
    scalability_considerations: true,
    security_considerations: true,
    deployment_plan: true,
    monitoring_logging: true,
    future_enhancements: true,
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("input")
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [specTypes, setSpecTypes] = useState<{ id: string; name: string; description: string }[]>([])

  // Fetch projects and specification types on component mount
  useEffect(() => {
    const fetchData = async () => {
      const [projectsResult, typesResult] = await Promise.all([getProjectsList(), getSpecificationTypes()])

      if (projectsResult.success) {
        setProjects(projectsResult.data)
      }

      if (typesResult.success) {
        setSpecTypes(typesResult.data)
      }
    }

    fetchData()
  }, [])

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
    if (!appName || !appDescription || !appType) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const result = await saveSpecificationImproved({
        appName,
        appDescription,
        appType,
        targetAudience,
        keyFeatures,
        technicalConstraints,
        includeItems,
        projectId: projectId || undefined,
        version,
        status,
        complexity,
        tags,
      })

      if (result.success) {
        toast({
          title: "Specification saved",
          description: "Your specification has been saved successfully.",
        })

        // Optionally redirect to the specification details page
        // window.location.href = `/specifications/${result.data.id}`
      } else {
        toast({
          title: "Error saving specification",
          description: result.error || "An error occurred while saving your specification.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag])
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
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
                  <Label htmlFor="app-name">
                    Application Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="app-name"
                    placeholder="e.g., Task Manager Pro"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app-type">
                    Application Type <span className="text-red-500">*</span>
                  </Label>
                  <Select value={appType} onValueChange={setAppType}>
                    <SelectTrigger id="app-type">
                      <SelectValue placeholder="Select application type" />
                    </SelectTrigger>
                    <SelectContent>
                      {specTypes.length > 0 ? (
                        specTypes.map((type) => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.description || type.name}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="web">Web Application</SelectItem>
                          <SelectItem value="mobile">Mobile Application</SelectItem>
                          <SelectItem value="desktop">Desktop Application</SelectItem>
                          <SelectItem value="saas">SaaS Platform</SelectItem>
                          <SelectItem value="ecommerce">E-Commerce</SelectItem>
                          <SelectItem value="crm">CRM System</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="app-description">
                  Application Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="app-description"
                  placeholder="Describe the purpose and main functionality of your application..."
                  rows={4}
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger id="project">
                      <SelectValue placeholder="Select a project (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complexity">Complexity</Label>
                  <Select value={complexity} onValueChange={setComplexity}>
                    <SelectTrigger id="complexity">
                      <SelectValue placeholder="Select complexity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    placeholder="e.g., 1.0"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="in-review">In Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="rounded-full hover:bg-gray-200 p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                  />
                  <Button type="button" size="sm" onClick={handleAddTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
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
                      checked={includeItems.functional_requirements}
                      onCheckedChange={(checked) => handleIncludeItemChange("functional_requirements", checked)}
                    />
                    <Label htmlFor="include-functional" className="text-sm font-normal">
                      Functional Requirements
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-non-functional"
                      checked={includeItems.non_functional_requirements}
                      onCheckedChange={(checked) => handleIncludeItemChange("non_functional_requirements", checked)}
                    />
                    <Label htmlFor="include-non-functional" className="text-sm font-normal">
                      Non-Functional Requirements
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-architecture"
                      checked={includeItems.system_architecture}
                      onCheckedChange={(checked) => handleIncludeItemChange("system_architecture", checked)}
                    />
                    <Label htmlFor="include-architecture" className="text-sm font-normal">
                      System Architecture
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-api"
                      checked={includeItems.api_design}
                      onCheckedChange={(checked) => handleIncludeItemChange("api_design", checked)}
                    />
                    <Label htmlFor="include-api" className="text-sm font-normal">
                      API Design
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-database"
                      checked={includeItems.database_schema}
                      onCheckedChange={(checked) => handleIncludeItemChange("database_schema", checked)}
                    />
                    <Label htmlFor="include-database" className="text-sm font-normal">
                      Database Schema
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-scalability"
                      checked={includeItems.scalability_considerations}
                      onCheckedChange={(checked) => handleIncludeItemChange("scalability_considerations", checked)}
                    />
                    <Label htmlFor="include-scalability" className="text-sm font-normal">
                      Scalability & Performance
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-security"
                      checked={includeItems.security_considerations}
                      onCheckedChange={(checked) => handleIncludeItemChange("security_considerations", checked)}
                    />
                    <Label htmlFor="include-security" className="text-sm font-normal">
                      Security Considerations
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-deployment"
                      checked={includeItems.deployment_plan}
                      onCheckedChange={(checked) => handleIncludeItemChange("deployment_plan", checked)}
                    />
                    <Label htmlFor="include-deployment" className="text-sm font-normal">
                      Deployment Plan
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-monitoring"
                      checked={includeItems.monitoring_logging}
                      onCheckedChange={(checked) => handleIncludeItemChange("monitoring_logging", checked)}
                    />
                    <Label htmlFor="include-monitoring" className="text-sm font-normal">
                      Monitoring & Logging
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-future"
                      checked={includeItems.future_enhancements}
                      onCheckedChange={(checked) => handleIncludeItemChange("future_enhancements", checked)}
                    />
                    <Label htmlFor="include-future" className="text-sm font-normal">
                      Future Enhancements
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => window.history.back()}>
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  {isGenerating ? "Generating..." : "Generate Specification"}
                </Button>
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Specification"}
                </Button>
              </div>
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
