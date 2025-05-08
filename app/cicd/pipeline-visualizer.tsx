"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPipelines } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Play, RefreshCw, Save, Share2 } from "lucide-react"

export function PipelineVisualizer() {
  const { toast } = useToast()
  const [pipelines, setPipelines] = useState([])
  const [selectedPipelineId, setSelectedPipelineId] = useState("")
  const [pipelineCode, setPipelineCode] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isVisualizing, setIsVisualizing] = useState(false)
  const [visualizationData, setVisualizationData] = useState(null)
  const [customName, setCustomName] = useState("")
  const [activeTab, setActiveTab] = useState("existing")

  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        const result = await getPipelines()
        if (result.success) {
          setPipelines(result.data || [])
        } else {
          console.error("Failed to load pipelines:", result.error)
          toast({
            title: "Error loading pipelines",
            description: result.error || "Failed to load pipelines",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching pipelines:", error)
        toast({
          title: "Error",
          description: "Failed to load pipelines",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPipelines()
  }, [toast])

  useEffect(() => {
    if (selectedPipelineId) {
      const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId)
      if (selectedPipeline) {
        setPipelineCode(selectedPipeline.pipeline_code || "")
        setCustomName(selectedPipeline.name || "")
      }
    }
  }, [selectedPipelineId, pipelines])

  const handleVisualize = async () => {
    if (!pipelineCode.trim()) {
      toast({
        title: "No pipeline code",
        description: "Please select a pipeline or enter pipeline code to visualize",
        variant: "destructive",
      })
      return
    }

    setIsVisualizing(true)

    try {
      // This is a mock visualization - in a real app, you'd send the code to a service
      // that would parse it and return a visualization structure
      await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call

      // Create a mock visualization based on the pipeline code
      const stages = extractStagesFromPipeline(pipelineCode)

      setVisualizationData({
        name: customName || "Pipeline Visualization",
        stages: stages,
        status: "success", // Mock status
        lastRun: new Date().toISOString(),
      })

      toast({
        title: "Pipeline visualized",
        description: "Your pipeline has been visualized successfully",
      })
    } catch (error) {
      console.error("Error visualizing pipeline:", error)
      toast({
        title: "Error",
        description: "Failed to visualize pipeline",
        variant: "destructive",
      })
    } finally {
      setIsVisualizing(false)
    }
  }

  // Helper function to extract stages from pipeline code
  const extractStagesFromPipeline = (code) => {
    // This is a simplified parser that tries to extract stages from different CI/CD formats
    const stages = []

    // Try to find GitHub Actions jobs
    const githubJobsMatch = code.match(/jobs:\s*([^]*?)(?:\n\w|$)/s)
    if (githubJobsMatch) {
      const jobsSection = githubJobsMatch[1]
      const jobMatches = jobsSection.matchAll(/(\w+):\s*\n(?:[^]*?)(?:runs-on|steps):/g)

      for (const match of jobMatches) {
        stages.push({
          name: match[1],
          status: Math.random() > 0.8 ? "failed" : "success", // Random status for demo
          steps: generateRandomSteps(3, 6),
        })
      }
    }

    // Try to find GitLab stages
    const gitlabStagesMatch = code.match(/stages:\s*\n((?:\s*-\s*[\w-]+\s*\n)+)/s)
    if (gitlabStagesMatch) {
      const stagesSection = gitlabStagesMatch[1]
      const stageMatches = stagesSection.matchAll(/-\s*([\w-]+)/g)

      for (const match of stageMatches) {
        stages.push({
          name: match[1],
          status: Math.random() > 0.8 ? "failed" : "success", // Random status for demo
          steps: generateRandomSteps(2, 5),
        })
      }
    }

    // If no stages found, create some default ones based on common patterns
    if (stages.length === 0) {
      // Look for common stage names in the code
      const commonStages = [
        { name: "build", regex: /\b(build|compile)\b/i },
        { name: "test", regex: /\b(test|testing|unit-test|integration-test)\b/i },
        { name: "lint", regex: /\b(lint|linting|eslint|stylelint)\b/i },
        { name: "deploy", regex: /\b(deploy|deployment|release)\b/i },
        { name: "docker", regex: /\b(docker|container|image)\b/i },
      ]

      for (const stage of commonStages) {
        if (stage.regex.test(code)) {
          stages.push({
            name: stage.name,
            status: Math.random() > 0.8 ? "failed" : "success", // Random status for demo
            steps: generateRandomSteps(2, 4),
          })
        }
      }

      // If still no stages found, create generic ones
      if (stages.length === 0) {
        stages.push(
          { name: "build", status: "success", steps: generateRandomSteps(3, 5) },
          { name: "test", status: "success", steps: generateRandomSteps(2, 4) },
          { name: "deploy", status: "success", steps: generateRandomSteps(1, 3) },
        )
      }
    }

    return stages
  }

  // Helper function to generate random steps for visualization
  const generateRandomSteps = (min, max) => {
    const stepCount = Math.floor(Math.random() * (max - min + 1)) + min
    const steps = []

    const stepTypes = [
      { name: "checkout", command: "git checkout" },
      { name: "install", command: "npm install" },
      { name: "build", command: "npm run build" },
      { name: "test", command: "npm test" },
      { name: "lint", command: "npm run lint" },
      { name: "docker", command: "docker build -t app ." },
      { name: "deploy", command: "deploy to production" },
    ]

    for (let i = 0; i < stepCount; i++) {
      const randomStep = stepTypes[Math.floor(Math.random() * stepTypes.length)]
      steps.push({
        name: `${randomStep.name}-${Math.floor(Math.random() * 1000)}`,
        command: randomStep.command,
        duration: Math.floor(Math.random() * 120) + 5, // 5-125 seconds
        status: Math.random() > 0.9 ? "failed" : "success", // 10% chance of failure
      })
    }

    return steps
  }

  const handleShare = () => {
    // In a real app, this would generate a shareable link
    toast({
      title: "Share link generated",
      description: "A shareable link has been copied to your clipboard",
    })
  }

  const handleSave = () => {
    // In a real app, this would save the visualization
    toast({
      title: "Visualization saved",
      description: "Your pipeline visualization has been saved",
    })
  }

  return (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="existing">Existing Pipeline</TabsTrigger>
          <TabsTrigger value="custom">Custom Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="existing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Pipeline</CardTitle>
              <CardDescription>Choose an existing pipeline to visualize</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pipeline-select">Pipeline</Label>
                  <Select
                    value={selectedPipelineId}
                    onValueChange={setSelectedPipelineId}
                    disabled={isLoading || pipelines.length === 0}
                  >
                    <SelectTrigger id="pipeline-select">
                      <SelectValue placeholder={isLoading ? "Loading pipelines..." : "Select a pipeline"} />
                    </SelectTrigger>
                    <SelectContent>
                      {pipelines.map((pipeline) => (
                        <SelectItem key={pipeline.id} value={pipeline.id}>
                          {pipeline.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isLoading && <p className="text-sm text-muted-foreground">Loading pipelines...</p>}
                  {!isLoading && pipelines.length === 0 && (
                    <p className="text-sm text-muted-foreground">No pipelines found. Create one first.</p>
                  )}
                </div>

                {selectedPipelineId && (
                  <div className="space-y-2">
                    <Label htmlFor="pipeline-code">Pipeline Code</Label>
                    <Textarea id="pipeline-code" value={pipelineCode} readOnly className="font-mono h-[200px]" />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleVisualize}
                disabled={isLoading || isVisualizing || !selectedPipelineId}
                className="gap-2"
              >
                {isVisualizing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Visualizing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Visualize Pipeline
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Pipeline</CardTitle>
              <CardDescription>Enter your own pipeline code to visualize</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-name">Pipeline Name</Label>
                  <Input
                    id="custom-name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Enter a name for this pipeline"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-code">Pipeline Code</Label>
                  <Textarea
                    id="custom-code"
                    value={pipelineCode}
                    onChange={(e) => setPipelineCode(e.target.value)}
                    placeholder="Paste your pipeline code here (GitHub Actions, GitLab CI, etc.)"
                    className="font-mono h-[300px]"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleVisualize} disabled={isVisualizing || !pipelineCode.trim()} className="gap-2">
                {isVisualizing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Visualizing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Visualize Pipeline
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {visualizationData && (
        <Card className="border-blue-200 shadow-md">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl text-blue-700">{visualizationData.name}</CardTitle>
                <CardDescription>Last run: {new Date(visualizationData.lastRun).toLocaleString()}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleShare} className="gap-1">
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </Button>
                <Button variant="outline" size="sm" onClick={handleSave} className="gap-1">
                  <Save className="h-3.5 w-3.5" />
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={handleVisualize} className="gap-1">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="pipeline-visualization">
              <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4">
                {visualizationData.stages.map((stage, index) => (
                  <div key={index} className="min-w-[250px] flex-shrink-0">
                    <div
                      className={`rounded-md border p-4 ${
                        stage.status === "success"
                          ? "bg-green-50 border-green-200"
                          : stage.status === "failed"
                            ? "bg-red-50 border-red-200"
                            : "bg-yellow-50 border-yellow-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium capitalize">{stage.name}</h3>
                        <div
                          className={`text-xs px-2 py-1 rounded-full ${
                            stage.status === "success"
                              ? "bg-green-100 text-green-800"
                              : stage.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {stage.status}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {stage.steps.map((step, stepIndex) => (
                          <div
                            key={stepIndex}
                            className={`text-sm p-2 rounded border ${
                              step.status === "success" ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="font-mono text-xs truncate">{step.command}</div>
                              <div className="text-xs text-muted-foreground">{step.duration}s</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Connector arrow */}
                    {index < visualizationData.stages.length - 1 && (
                      <div className="hidden md:flex justify-center my-2">
                        <div className="w-6 h-6 flex items-center justify-center">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M5 12H19M19 12L12 5M19 12L12 19"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pipeline summary */}
              <div className="mt-6 bg-slate-50 rounded-md p-4 border">
                <h3 className="font-medium mb-2">Pipeline Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded border">
                    <div className="text-sm text-muted-foreground">Total Stages</div>
                    <div className="text-2xl font-bold">{visualizationData.stages.length}</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-sm text-muted-foreground">Total Steps</div>
                    <div className="text-2xl font-bold">
                      {visualizationData.stages.reduce((acc, stage) => acc + stage.steps.length, 0)}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(
                        (visualizationData.stages.filter((s) => s.status === "success").length /
                          visualizationData.stages.length) *
                          100,
                      )}
                      %
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-sm text-muted-foreground">Total Duration</div>
                    <div className="text-2xl font-bold">
                      {visualizationData.stages.reduce(
                        (acc, stage) => acc + stage.steps.reduce((a, step) => a + step.duration, 0),
                        0,
                      )}
                      s
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
