"use client"

import { CardFooter } from "@/components/ui/card"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Download, GitBranch, Loader2, Save, Wand2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getSpecifications, getSpecificationById } from "../specification-generator/actions"
import { savePipeline } from "./actions"
import { useAIProvider } from "@/context/ai-provider-context"
import { generateAIText } from "@/lib/ai-service"

export function CICDPipelineBuilder() {
  const { toast } = useToast()
  const { provider, temperature } = useAIProvider()
  const [pipelineType, setPipelineType] = useState("github")
  const [pipelineCode, setPipelineCode] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("input")
  const [pipelineName, setPipelineName] = useState("")

  // Added for integration with specifications and designs
  const [specificationsList, setSpecificationsList] = useState([])
  const [selectedSpecificationId, setSelectedSpecificationId] = useState("")
  const [isLoadingSpecifications, setIsLoadingSpecifications] = useState(true)
  const [designsList, setDesignsList] = useState([])
  const [selectedDesignId, setSelectedDesignId] = useState("")
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false)

  // Fetch specifications list on component mount
  useEffect(() => {
    const fetchSpecifications = async () => {
      try {
        const result = await getSpecifications()
        if (result.success) {
          setSpecificationsList(result.data || [])
        } else {
          console.error("Failed to load specifications:", result.error)
        }
      } catch (error) {
        console.error("Error fetching specifications:", error)
      } finally {
        setIsLoadingSpecifications(false)
      }
    }

    fetchSpecifications()
  }, [])

  // Fetch designs when a specification is selected
  useEffect(() => {
    const fetchDesigns = async () => {
      if (!selectedSpecificationId) {
        setDesignsList([])
        return
      }

      setIsLoadingDesigns(true)
      try {
        console.log("Fetching designs for specification:", selectedSpecificationId)

        // Direct API call to get designs for this specification
        const response = await fetch(`/api/designs?specificationId=${selectedSpecificationId}`)
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const designs = await response.json()
        console.log("Fetched designs:", designs)

        if (designs && designs.length > 0) {
          setDesignsList(designs)
        } else {
          console.log("No designs found for this specification")
          setDesignsList([])
        }
      } catch (error) {
        console.error("Error fetching designs:", error)
        toast({
          title: "Error",
          description: "Failed to load designs. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingDesigns(false)
      }
    }

    fetchDesigns()
  }, [selectedSpecificationId, toast])

  // Function to generate pipeline from specification
  const generateFromSpecification = async () => {
    if (!selectedSpecificationId) {
      toast({
        title: "No specification selected",
        description: "Please select a specification to generate a pipeline from.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setActiveTab("output")

    try {
      // Get specification details
      const specResult = await getSpecificationById(selectedSpecificationId)
      if (!specResult.success) {
        throw new Error(specResult.error || "Failed to get specification details")
      }

      const specData = specResult.data

      // Set default pipeline name based on specification
      setPipelineName(`${specData.app_name} - CI/CD Pipeline`)

      // Get design details if a design is selected
      let designInfo = ""
      if (selectedDesignId) {
        const selectedDesign = designsList.find((design) => design.id === selectedDesignId)
        if (selectedDesign) {
          designInfo = `
Design Type: ${selectedDesign.type}

${selectedDesign.diagram_code}`
        }
      }

      // Create a system prompt for the AI
      const systemPrompt = `You are an expert DevOps engineer specializing in CI/CD pipelines.
Your task is to create a comprehensive CI/CD pipeline configuration for the specified platform.
The pipeline should follow best practices and include all necessary stages for a modern software development workflow.
Only output the pipeline configuration code without any explanation or additional text.`

      // Create the prompt for the AI
      const prompt = `Create a ${pipelineType} CI/CD pipeline configuration for the following application:

Application Name: ${specData.app_name}
Application Type: ${specData.app_type}
Description: ${specData.app_description}

${specData.functional_requirements ? `Functional Requirements: ${specData.functional_requirements}` : ""}
${designInfo ? `System Design Information: ${designInfo}` : ""}

The pipeline should include the following stages:
1. Build - Compile and build the application
2. Test - Run unit tests, integration tests, and any other relevant tests
3. Deploy - Deploy the application to the appropriate environment

Please provide ONLY the pipeline configuration code for ${pipelineType}, without any explanation or additional text.`

      // Generate the pipeline using AI
      const result = await generateAIText(prompt, systemPrompt, {
        provider,
        temperature,
      })

      if (result.success) {
        setPipelineCode(result.text.trim())
        toast({
          title: "Pipeline generated",
          description: "CI/CD pipeline has been generated based on the selected specification.",
        })
      } else {
        throw new Error(result.error || "Failed to generate pipeline")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate pipeline",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSavePipeline = async () => {
    if (!selectedSpecificationId) {
      toast({
        title: "Error",
        description: "Please select a specification to save the pipeline.",
        variant: "destructive",
      })
      return
    }

    if (!pipelineCode.trim()) {
      toast({
        title: "Error",
        description: "No pipeline to save. Please generate a pipeline first.",
        variant: "destructive",
      })
      return
    }

    if (!pipelineName.trim()) {
      toast({
        title: "Error",
        description: "Please provide a name for the pipeline.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const result = await savePipeline({
        name: pipelineName,
        pipelineType,
        pipelineCode,
        specificationId: selectedSpecificationId,
        designId: selectedDesignId || null,
        metadata: {
          generatedWith: provider,
          temperature,
          timestamp: new Date().toISOString(),
        },
      })

      if (result.success) {
        toast({
          title: "Pipeline saved",
          description: "Your CI/CD pipeline has been saved successfully.",
        })
      } else {
        throw new Error(result.error || "Failed to save pipeline")
      }
    } catch (error) {
      console.error("Error saving pipeline:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save pipeline.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = () => {
    // In a real app, this would download the generated pipeline
    const extension =
      pipelineType === "github" || pipelineType === "gitlab" || pipelineType === "generic"
        ? "yml"
        : pipelineType === "jenkins"
          ? "jenkinsfile"
          : "yaml"

    const filename =
      pipelineType === "github"
        ? "github-workflow.yml"
        : pipelineType === "gitlab"
          ? ".gitlab-ci.yml"
          : pipelineType === "azure"
            ? "azure-pipelines.yml"
            : pipelineType === "jenkins"
              ? "Jenkinsfile"
              : "pipeline.yml"

    const blob = new Blob([pipelineCode], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Pipeline downloaded",
      description: `Your CI/CD pipeline has been downloaded as ${filename}.`,
    })
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="input">Configure Pipeline</TabsTrigger>
          <TabsTrigger value="output">Generated Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>CI/CD Pipeline Configuration</CardTitle>
              <CardDescription>Configure your CI/CD pipeline settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Generate from Specification</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="specification">Select Specification</Label>
                    <Select
                      value={selectedSpecificationId}
                      onValueChange={setSelectedSpecificationId}
                      disabled={isLoadingSpecifications}
                    >
                      <SelectTrigger id="specification">
                        <SelectValue placeholder="Select a specification" />
                      </SelectTrigger>
                      <SelectContent>
                        {specificationsList.map((spec) => (
                          <SelectItem key={spec.id} value={spec.id}>
                            {spec.app_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isLoadingSpecifications && (
                      <p className="text-sm text-muted-foreground">Loading specifications...</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="design">Select Design (Optional)</Label>
                    <Select
                      value={selectedDesignId}
                      onValueChange={setSelectedDesignId}
                      disabled={isLoadingDesigns || !selectedSpecificationId || designsList.length === 0}
                    >
                      <SelectTrigger id="design" className="w-full">
                        <SelectValue
                          placeholder={
                            isLoadingDesigns
                              ? "Loading designs..."
                              : designsList.length === 0
                                ? "No designs available"
                                : "Select a design"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {designsList.map((design) => (
                          <SelectItem key={design.id} value={design.id}>
                            {design.project_name
                              ? `${design.project_name} - ${design.type.charAt(0).toUpperCase() + design.type.slice(1)}`
                              : `${design.type.charAt(0).toUpperCase() + design.type.slice(1)} Design`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isLoadingDesigns && <p className="text-sm text-muted-foreground">Loading designs...</p>}
                    {!isLoadingDesigns && selectedSpecificationId && designsList.length === 0 && (
                      <p className="text-sm text-muted-foreground">No designs found for this specification</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pipeline-type">Pipeline Type</Label>
                  <Select value={pipelineType} onValueChange={setPipelineType}>
                    <SelectTrigger id="pipeline-type">
                      <SelectValue placeholder="Select pipeline type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="github">GitHub Actions</SelectItem>
                      <SelectItem value="gitlab">GitLab CI/CD</SelectItem>
                      <SelectItem value="azure">Azure DevOps</SelectItem>
                      <SelectItem value="jenkins">Jenkins</SelectItem>
                      <SelectItem value="generic">Generic Pipeline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={generateFromSpecification}
                    disabled={!selectedSpecificationId || isGenerating}
                    className="gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        Generate Pipeline
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="output" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Generated Pipeline</CardTitle>
              <CardDescription>Review, save, and download your CI/CD pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Generating CI/CD pipeline...</p>
                  </div>
                </div>
              ) : pipelineCode ? (
                <>
                  <div className="mb-4">
                    <Label htmlFor="pipeline-name">Pipeline Name</Label>
                    <Input
                      id="pipeline-name"
                      value={pipelineName}
                      onChange={(e) => setPipelineName(e.target.value)}
                      placeholder="Enter a name for this pipeline"
                      className="mb-4"
                    />
                  </div>
                  <div className="relative">
                    <Textarea
                      value={pipelineCode}
                      onChange={(e) => setPipelineCode(e.target.value)}
                      className="font-mono text-sm h-[400px]"
                    />
                  </div>
                </>
              ) : (
                <div className="text-center p-12 text-muted-foreground">
                  <GitBranch className="h-12 w-12 mx-auto mb-4" />
                  <p>No pipeline generated yet. Configure your pipeline settings and click "Generate Pipeline".</p>
                </div>
              )}
            </CardContent>
            {pipelineCode && (
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("input")} className="gap-2">
                  Edit Configuration
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleDownload} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    onClick={handleSavePipeline}
                    disabled={isSaving || !selectedSpecificationId || !pipelineName.trim()}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Pipeline"}
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
