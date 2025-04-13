"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { GitPullRequest, Plus, Save, Trash } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CICDPipelineBuilder() {
  const { toast } = useToast()
  const [platform, setPlatform] = useState("github")
  const [projectName, setProjectName] = useState("")
  const [steps, setSteps] = useState([
    { name: "Install Dependencies", command: "npm install", enabled: true },
    { name: "Run Tests", command: "npm test", enabled: true },
    { name: "Build", command: "npm run build", enabled: true },
  ])
  const [environments, setEnvironments] = useState([
    { name: "Development", branch: "develop", autoDeployment: true },
    { name: "Staging", branch: "staging", autoDeployment: true },
    { name: "Production", branch: "main", autoDeployment: false },
  ])
  const [generatedConfig, setGeneratedConfig] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState("pipeline")

  const addStep = () => {
    setSteps([...steps, { name: "", command: "", enabled: true }])
  }

  const updateStep = (index, field, value) => {
    const updatedSteps = [...steps]
    updatedSteps[index][field] = value
    setSteps(updatedSteps)
  }

  const removeStep = (index) => {
    const updatedSteps = [...steps]
    updatedSteps.splice(index, 1)
    setSteps(updatedSteps)
  }

  const addEnvironment = () => {
    setEnvironments([...environments, { name: "", branch: "", autoDeployment: false }])
  }

  const updateEnvironment = (index, field, value) => {
    const updatedEnvironments = [...environments]
    updatedEnvironments[index][field] = value
    setEnvironments(updatedEnvironments)
  }

  const removeEnvironment = (index) => {
    const updatedEnvironments = [...environments]
    updatedEnvironments.splice(index, 1)
    setEnvironments(updatedEnvironments)
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setActiveTab("config")

    // Simulate config generation delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Generate GitHub Actions workflow YAML
    let configYaml = ""

    if (platform === "github") {
      configYaml = `# ${projectName} CI/CD Pipeline
name: CI/CD Pipeline

on:
  push:
    branches: [${environments.map((env) => `"${env.branch}"`).join(", ")}]
  pull_request:
    branches: [${environments.map((env) => `"${env.branch}"`).join(", ")}]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
${steps
  .filter((step) => step.enabled)
  .map(
    (step) => `      - name: ${step.name}
        run: ${step.command}
`,
  )
  .join("")}
${environments
  .map(
    (env) => `
  deploy-to-${env.name.toLowerCase()}:
    needs: build-and-test
    if: success() && (github.ref == 'refs/heads/${env.branch}'${env.autoDeployment ? "" : " && github.event_name == 'workflow_dispatch'"})
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to ${env.name}
        run: echo "Deploying to ${env.name} environment"
        # Add your deployment commands here
`,
  )
  .join("")}`
    } else if (platform === "gitlab") {
      configYaml = `# ${projectName} CI/CD Pipeline

stages:
  - build
  - test
  - deploy

variables:
  NODE_VERSION: "18"

before_script:
  - echo "Preparing environment"

${steps
  .filter((step) => step.enabled)
  .map((step, index) => {
    if (step.name.toLowerCase().includes("test")) {
      return `test:
  stage: test
  script:
    - ${step.command}
  only:
    - ${environments.map((env) => env.branch).join("\n    - ")}
`
    } else if (step.name.toLowerCase().includes("build")) {
      return `build:
  stage: build
  script:
    - ${step.command}
  only:
    - ${environments.map((env) => env.branch).join("\n    - ")}
`
    } else {
      return `${step.name.toLowerCase().replace(/\s+/g, "-")}:
  stage: build
  script:
    - ${step.command}
  only:
    - ${environments.map((env) => env.branch).join("\n    - ")}
`
    }
  })
  .join("\n")}

${environments
  .map(
    (env) => `deploy-${env.name.toLowerCase()}:
  stage: deploy
  script:
    - echo "Deploying to ${env.name} environment"
    # Add your deployment commands here
  only:
    - ${env.branch}
  when: ${env.autoDeployment ? "on_success" : "manual"}
`,
  )
  .join("\n")}`
    } else if (platform === "azure") {
      configYaml = `# ${projectName} CI/CD Pipeline

trigger:
  branches:
    include:
${environments.map((env) => `      - ${env.branch}`).join("\n")}

pool:
  vmImage: 'ubuntu-latest'

steps:
${steps
  .filter((step) => step.enabled)
  .map(
    (step) => `- script: ${step.command}
  displayName: ${step.name}
`,
  )
  .join("")}

${environments
  .map(
    (env, index) => `- task: AzureWebApp@1
  displayName: 'Deploy to ${env.name}'
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/${env.branch}')${env.autoDeployment ? "" : ", eq(variables['Build.Reason'], 'Manual')"})
  inputs:
    azureSubscription: '\$(AZURE_SUBSCRIPTION)'
    appName: '\$(APP_NAME_${env.name.toUpperCase()})'
    package: '\$(System.DefaultWorkingDirectory)/**/*.zip'
`,
  )
  .join("\n")}`
    }

    setGeneratedConfig(configYaml)
    setIsGenerating(false)

    toast({
      title: "Pipeline configuration generated",
      description: "Your CI/CD pipeline configuration has been generated successfully.",
    })
  }

  const handleSave = () => {
    // In a real app, this would save the configuration to a file
    toast({
      title: "Configuration saved",
      description: "Your CI/CD pipeline configuration has been saved.",
    })
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pipeline">Pipeline Setup</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>CI/CD Pipeline Configuration</CardTitle>
              <CardDescription>Set up your continuous integration and deployment pipeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="platform">CI/CD Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger id="platform">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="github">GitHub Actions</SelectItem>
                      <SelectItem value="gitlab">GitLab CI</SelectItem>
                      <SelectItem value="azure">Azure DevOps</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    placeholder="e.g., My Awesome Project"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Pipeline Steps</Label>
                  <Button type="button" onClick={addStep} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step
                  </Button>
                </div>

                {steps.map((step, index) => (
                  <div key={index} className="space-y-4 p-4 border rounded-md relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => removeStep(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`step-enabled-${index}`}
                        checked={step.enabled}
                        onCheckedChange={(checked) => updateStep(index, "enabled", checked)}
                      />
                      <Label htmlFor={`step-enabled-${index}`} className="text-sm font-normal">
                        Enabled
                      </Label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`step-name-${index}`}>Step Name</Label>
                        <Input
                          id={`step-name-${index}`}
                          placeholder="e.g., Run Tests"
                          value={step.name}
                          onChange={(e) => updateStep(index, "name", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`step-command-${index}`}>Command</Label>
                        <Input
                          id={`step-command-${index}`}
                          placeholder="e.g., npm test"
                          value={step.command}
                          onChange={(e) => updateStep(index, "command", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Deployment Environments</Label>
                  <Button type="button" onClick={addEnvironment} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Environment
                  </Button>
                </div>

                {environments.map((env, index) => (
                  <div key={index} className="space-y-4 p-4 border rounded-md relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => removeEnvironment(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`env-name-${index}`}>Environment Name</Label>
                        <Input
                          id={`env-name-${index}`}
                          placeholder="e.g., Production"
                          value={env.name}
                          onChange={(e) => updateEnvironment(index, "name", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`env-branch-${index}`}>Branch</Label>
                        <Input
                          id={`env-branch-${index}`}
                          placeholder="e.g., main"
                          value={env.branch}
                          onChange={(e) => updateEnvironment(index, "branch", e.target.value)}
                        />
                      </div>

                      <div className="flex items-center space-x-2 self-end">
                        <Checkbox
                          id={`env-auto-${index}`}
                          checked={env.autoDeployment}
                          onCheckedChange={(checked) => updateEnvironment(index, "autoDeployment", checked)}
                        />
                        <Label htmlFor={`env-auto-${index}`} className="text-sm font-normal">
                          Auto Deployment
                        </Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleGenerate} disabled={!projectName.trim() || isGenerating} className="gap-2">
                <GitPullRequest className="h-4 w-4" />
                {isGenerating ? "Generating..." : "Generate Pipeline Config"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Generated Configuration</CardTitle>
              <CardDescription>Review and save your CI/CD pipeline configuration</CardDescription>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Generating pipeline configuration...</p>
                  </div>
                </div>
              ) : generatedConfig ? (
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[500px] text-sm font-mono">
                    {generatedConfig}
                  </pre>
                </div>
              ) : (
                <div className="text-center p-12 text-muted-foreground">
                  <GitPullRequest className="h-12 w-12 mx-auto mb-4" />
                  <p>No configuration generated yet. Configure your pipeline and click "Generate Pipeline Config".</p>
                </div>
              )}
            </CardContent>
            {generatedConfig && (
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("pipeline")} className="gap-2">
                  Edit Pipeline
                </Button>
                <Button onClick={handleSave} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Configuration
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
