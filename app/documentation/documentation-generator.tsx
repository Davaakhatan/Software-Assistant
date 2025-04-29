"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Download, FileText, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getSpecifications, getSpecificationById } from "../specification-generator/actions"
import { getDesigns } from "../design/actions"
import { saveDocumentation } from "./actions"
import { generateAIText } from "@/lib/ai-service"
import { getRequirements } from "../requirements/actions"
import { getGeneratedCode } from "../code-generation/actions"
import { useAIProvider } from "@/context/ai-provider-context"

export default function DocumentationGenerator() {
  const { toast } = useToast()
  const { provider, temperature } = useAIProvider()
  const [docType, setDocType] = useState("api")
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [sections, setSections] = useState({
    overview: true,
    gettingStarted: true,
    installation: true,
    usage: true,
    api: true,
    examples: true,
    troubleshooting: false,
    contributing: false,
    license: false,
  })
  const [generatedDocs, setGeneratedDocs] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("config")
  const [documentationType, setDocumentationType] = useState("user")
  const [documentationContent, setDocumentationContent] = useState("")
  const [documentationName, setDocumentationName] = useState("")

  const [aiPrompt, setAiPrompt] = useState("")
  const [isAiGenerating, setIsAiGenerating] = useState(false)
  const [showAiPrompt, setShowAiPrompt] = useState(false)

  // Project selection states
  const [specificationsList, setSpecificationsList] = useState([])
  const [requirementsList, setRequirementsList] = useState([])
  const [designsList, setDesignsList] = useState([])
  const [codeList, setCodeList] = useState([])
  const [selectedSpecificationId, setSelectedSpecificationId] = useState("")
  const [selectedRequirementId, setSelectedRequirementId] = useState("")
  const [selectedDesignId, setSelectedDesignId] = useState("")
  const [selectedCodeId, setSelectedCodeId] = useState("")
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [projectContext, setProjectContext] = useState("")
  const [relatedDesigns, setRelatedDesigns] = useState([])
  const [relatedCode, setRelatedCode] = useState([])

  const handleSectionChange = (section, checked) => {
    setSections({
      ...sections,
      [section]: checked,
    })
  }

  // Fetch projects data on component mount
  useEffect(() => {
    const fetchProjectsData = async () => {
      setIsLoadingProjects(true)
      try {
        // Fetch specifications
        const specificationsResult = await getSpecifications()
        if (specificationsResult.success) {
          setSpecificationsList(specificationsResult.data || [])
        }

        // Fetch requirements
        const requirementsResult = await getRequirements()
        if (requirementsResult.success) {
          setRequirementsList(requirementsResult.data || [])
        }

        // Fetch designs
        const designsResult = await getDesigns()
        if (designsResult.success) {
          setDesignsList(designsResult.data || [])
        }

        // Fetch generated code
        const codeResult = await getGeneratedCode()
        if (codeResult.success) {
          setCodeList(codeResult.data || [])
        }
      } catch (error) {
        console.error("Error fetching projects data:", error)
        toast({
          title: "Error",
          description: "Failed to load projects data.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingProjects(false)
      }
    }

    fetchProjectsData()
  }, [toast])

  // Update project context when specification is selected
  useEffect(() => {
    if (selectedSpecificationId) {
      const specification = specificationsList.find((spec) => spec.id === selectedSpecificationId)
      if (specification) {
        setProjectName(specification.app_name || "")
        setProjectDescription(specification.app_description || "")
        setDocumentationName(specification.app_name || "")

        // Find related requirement
        const relatedRequirement = requirementsList.find((req) => req.specification_id === selectedSpecificationId)
        if (relatedRequirement) {
          setSelectedRequirementId(relatedRequirement.id)

          // Find related designs
          const designs = designsList.filter((design) => design.requirement_id === relatedRequirement.id)
          setRelatedDesigns(designs)

          // Find related code
          const code = codeList.filter((code) => code.requirement_id === relatedRequirement.id)
          setRelatedCode(code)

          // Build project context for AI
          let context = `Specification: ${specification.app_name}
${specification.app_description || ""}`
          context += `

Requirement: ${relatedRequirement.project_name}
${relatedRequirement.project_description || ""}`

          if (designs.length > 0) {
            context += `

Designs:`
            designs.forEach((design) => {
              context += `
- ${design.type || "Untitled Design"}: ${design.description || ""}`
            })
          }

          if (code.length > 0) {
            context += `

Implemented Code:`
            code.forEach((c) => {
              context += `
- ${c.language || "Untitled Code"}: ${c.requirements || ""}`
            })
          }

          setProjectContext(context)
        }
      }
    }
  }, [selectedSpecificationId, specificationsList, requirementsList, designsList, codeList])

  // Update selected design context
  useEffect(() => {
    if (selectedDesignId) {
      const design = designsList.find((d) => d.id === selectedDesignId)
      if (design) {
        // Add design details to documentation name if not already set from specification
        if (!documentationName && design.type) {
          setDocumentationName(design.type)
        }
      }
    }
  }, [selectedDesignId, designsList, documentationName])

  const handleAiGenerate = async () => {
    if (!projectName.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a project name or select a specification.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setIsAiGenerating(true)
    setActiveTab("preview")

    try {
      // Construct a prompt based on the selected sections and documentation type
      const sectionsText = Object.entries(sections)
        .filter(([_, included]) => included)
        .map(([section]) => {
          // Convert camelCase to readable format
          return section.replace(/([A-Z])/g, " $1").toLowerCase()
        })
        .join(", ")

      // Build the prompt with project context if available
      let contextPrompt = `Generate comprehensive ${docType} documentation for a project named "${projectName}".
     
     Project description: ${projectDescription || "A software project"}
     
     Include the following sections: ${sectionsText}`

      if (projectContext) {
        contextPrompt += `

Project context:
${projectContext}`
      }

      if (aiPrompt.trim()) {
        contextPrompt += `

Additional requirements: ${aiPrompt}`
      }

      contextPrompt += `

Format the documentation in Markdown.`

      const result = await generateAIText(
        contextPrompt,
        "You are a technical writer who creates clear, comprehensive software documentation.",
        {
          provider,
          temperature,
        },
      )

      if (result.success && result.text) {
        setGeneratedDocs(result.text)
        setDocumentationContent(result.text)

        toast({
          title: "Documentation generated",
          description: "AI-generated documentation is ready for review.",
        })
      } else {
        toast({
          title: "AI generation failed",
          description: result.error || "Failed to generate documentation. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error in AI documentation generation:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred during AI generation.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
      setIsAiGenerating(false)
    }
  }

  const generateFromSpecification = async () => {
    if (!selectedSpecificationId) {
      toast({
        title: "Error",
        description: "Please select a specification to generate documentation from.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setActiveTab("preview")

    try {
      const result = await getSpecificationById(selectedSpecificationId)
      if (result.success && result.data) {
        const specification = result.data

        // Use AI to generate documentation based on the specification and context
        let aiPrompt = `Generate comprehensive documentation based on the following software specification:
     
     Title: ${specification.app_name}
     Description: ${specification.app_description}
     Use Cases: ${specification.use_cases}
     Acceptance Criteria: ${specification.acceptance_criteria}`

        if (projectContext) {
          aiPrompt += `

Additional project context:
${projectContext}`
        }

        aiPrompt += `

Format the documentation in Markdown with appropriate sections including Overview, Features, Installation, Usage, and API Reference if applicable.`

        const aiResult = await generateAIText(
          aiPrompt,
          "You are a technical writer who creates clear, comprehensive software documentation based on specifications.",
          {
            provider,
            temperature,
          },
        )

        if (aiResult.success && aiResult.text) {
          setGeneratedDocs(aiResult.text)
          setDocumentationContent(aiResult.text)
          toast({
            title: "Documentation generated",
            description: "AI-generated documentation from specification is ready for review.",
          })
        } else {
          // Fallback to template-based generation if AI fails
          const generatedContent = `# ${specification.app_name} Documentation

## Overview

${specification.app_description}

### Use Cases

${specification.use_cases}

### Acceptance Criteria

${specification.acceptance_criteria}
`
          setGeneratedDocs(generatedContent)
          setDocumentationContent(generatedContent)
          toast({
            title: "Documentation generated",
            description: "Documentation generated from specification successfully.",
          })
        }
      } else {
        console.error("Failed to load specification:", result.error)
        toast({
          title: "Error",
          description: "Failed to generate documentation from specification.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error generating documentation:", error)
      toast({
        title: "Error",
        description: "An error occurred while generating documentation.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!documentationName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a documentation name.",
        variant: "destructive",
      })
      return
    }

    if (!generatedDocs || !generatedDocs.trim()) {
      toast({
        title: "Error",
        description: "Please generate documentation content first.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      // IMPORTANT: For this attempt, let's try saving WITHOUT a specification ID
      // This should avoid the foreign key constraint issue entirely

      console.log("About to save documentation with params:", {
        name: documentationName,
        documentationType: documentationType || "user",
        contentLength: generatedDocs?.length || 0,
        specificationId: null, // Force to null for this attempt
        projectDescription: projectDescription || "No description provided",
      })

      // Create a simple object to test saving
      const testObj = {
        name: documentationName,
        documentationType: documentationType || "user",
        documentationContent: generatedDocs,
        specificationId: null, // Force to null for this attempt
        designId: null,
        codeId: null,
        projectDescription: projectDescription || "No description provided",
      }

      // Try to save with the updated column names
      const result = await saveDocumentation(testObj)

      if (result.success) {
        toast({
          title: "Documentation saved",
          description: "Your documentation has been saved successfully.",
        })
      } else {
        console.error("Save documentation error:", result.error)
        toast({
          title: "Error",
          description: `Failed to save documentation: ${result.error || "Unknown error"}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving documentation:", error)
      toast({
        title: "Error",
        description: `An error occurred while saving documentation: ${error?.message || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = () => {
    if (!generatedDocs) {
      toast({
        title: "Error",
        description: "No documentation to download.",
        variant: "destructive",
      })
      return
    }

    // Create a blob with the documentation content
    const blob = new Blob([generatedDocs], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)

    // Create a temporary link and trigger download
    const a = document.createElement("a")
    a.href = url
    a.download = `${documentationName || "documentation"}.md`
    document.body.appendChild(a)
    a.click()

    // Clean up
    URL.revokeObjectURL(url)
    document.body.removeChild(a)

    toast({
      title: "Documentation downloaded",
      description: "Your documentation has been downloaded as Markdown.",
    })
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setActiveTab("preview")

    // Simulate documentation generation delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // In a real app, this would call an AI service to generate documentation
    const sampleDocs = `# ${projectName} Documentation

## Overview

${projectDescription}

${
  sections.gettingStarted
    ? `## Getting Started

This section provides a quick introduction to get you up and running with ${projectName}.

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn
- A modern web browser

${
  sections.installation
    ? `### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/yourusername/${projectName.toLowerCase().replace(/\s+/g, "-")}.git

# Navigate to the project directory
cd ${projectName.toLowerCase().replace(/\s+/g, "-")}

# Install dependencies
npm install

# Start the development server
npm run dev
\`\`\``
    : ""
}`
    : ""
}

${
  sections.usage
    ? `## Usage

Here's how to use ${projectName} in your project:

\`\`\`jsx
import { Component } from '${projectName.toLowerCase().replace(/\s+/g, "-")}'

function App() {
  return (
    <div>
      <Component />
    </div>
  )
}
\`\`\``
    : ""
}

${
  sections.api
    ? `## API Reference

${
  docType === "api"
    ? `### Endpoints

#### GET /api/users

Retrieves a list of users.

**Parameters:**

- \`limit\` (optional): Number of users to return (default: 10)
- \`offset\` (optional): Number of users to skip (default: 0)

**Response:**

\`\`\`json
{
  "users": [
    {
      "id": "1",
      "name": "John Doe",
      "email": "john@example.com"
    },
    // ...
  ],
  "total": 100
}
\`\`\``
    : `### Components

#### \`Button\`

A customizable button component.

**Props:**

- \`variant\` (string): The button style variant ('default', 'outline', 'ghost')
- \`size\` (string): The button size ('sm', 'md', 'lg')
- \`onClick\` (function): Function to call when the button is clicked

**Example:**

\`\`\`jsx
<Button variant="outline" size="lg" onClick={() => console.log('Clicked!')}>
  Click Me
</Button>
\`\`\``
}`
    : ""
}

${
  sections.examples
    ? `## Examples

Here are some examples of how to use ${projectName}:

### Basic Example

\`\`\`jsx
import { useState } from 'react'
import { Button, Input } from '${projectName.toLowerCase().replace(/\s+/g, "-")}'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Login attempt with:', { email, password })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <Button type="submit">Log In</Button>
    </form>
  )
}
\`\`\``
    : ""
}

${
  sections.troubleshooting
    ? `## Troubleshooting

### Common Issues

#### Installation Errors

If you encounter errors during installation, try the following:

1. Clear npm cache: \`npm cache clean --force\`
2. Delete node_modules: \`rm -rf node_modules\`
3. Reinstall dependencies: \`npm install\`

#### Build Failures

If your build is failing, check:

1. Node.js version compatibility
2. Missing dependencies
3. Environment variables`
    : ""
}

${
  sections.contributing
    ? `## Contributing

We welcome contributions to ${projectName}!

1. Fork the repository
2. Create your feature branch: \`git checkout -b feature/amazing-feature\`
3. Commit your changes: \`git commit -m 'Add some amazing feature'\`
4. Push to the branch: \`git push origin feature/amazing-feature\`
5. Open a Pull Request`
    : ""
}

${
  sections.license
    ? `## License

This project is licensed under the MIT License - see the LICENSE file for details.`
    : ""
}`

    setGeneratedDocs(sampleDocs)
    setDocumentationContent(sampleDocs)
    setIsGenerating(false)

    toast({
      title: "Documentation generated",
      description: "Your documentation has been generated successfully.",
    })
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="config">Configure</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Documentation Settings</CardTitle>
              <CardDescription>Configure your documentation generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Project Selection */}
              <div className="space-y-4">
                <Label>Select Project</Label>
                <div className="space-y-2">
                  <Label htmlFor="specification-select">Specification</Label>
                  <Select
                    value={selectedSpecificationId}
                    onValueChange={setSelectedSpecificationId}
                    disabled={isLoadingProjects}
                  >
                    <SelectTrigger id="specification-select">
                      <SelectValue placeholder={isLoadingProjects ? "Loading..." : "Select a specification"} />
                    </SelectTrigger>
                    <SelectContent>
                      {specificationsList.map((spec) => (
                        <SelectItem key={spec.id} value={spec.id}>
                          {spec.app_name || "Untitled Specification"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {relatedDesigns.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="design-select">Design (Optional)</Label>
                    <Select value={selectedDesignId} onValueChange={setSelectedDesignId}>
                      <SelectTrigger id="design-select">
                        <SelectValue placeholder="Select a design (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {relatedDesigns.map((design) => (
                          <SelectItem key={design.id} value={design.id}>
                            {design.title || "Untitled Design"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {relatedCode.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="code-select">Implementation (Optional)</Label>
                    <Select value={selectedCodeId} onValueChange={setSelectedCodeId}>
                      <SelectTrigger id="code-select">
                        <SelectValue placeholder="Select code implementation (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {relatedCode.map((code) => (
                          <SelectItem key={code.id} value={code.id}>
                            {code.language || "Untitled Code"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {projectContext && (
                  <div className="p-3 bg-muted rounded-md text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4" />
                      <p className="font-medium">Project Context</p>
                    </div>
                    <p className="whitespace-pre-line">{projectContext}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-type">Documentation Type</Label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger id="doc-type">
                    <SelectValue placeholder="Select documentation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="api">API Documentation</SelectItem>
                    <SelectItem value="user">User Guide</SelectItem>
                    <SelectItem value="developer">Developer Documentation</SelectItem>
                    <SelectItem value="component">Component Library</SelectItem>
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

              <div className="space-y-2">
                <Label htmlFor="project-description">Project Description</Label>
                <Textarea
                  id="project-description"
                  placeholder="Briefly describe your project..."
                  rows={4}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentation-name">Documentation Name</Label>
                <Input
                  id="documentation-name"
                  placeholder="e.g., API Reference Guide"
                  value={documentationName}
                  onChange={(e) => setDocumentationName(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label>Sections to Include</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="overview"
                      checked={sections.overview}
                      onCheckedChange={(checked) => handleSectionChange("overview", checked)}
                    />
                    <Label htmlFor="overview" className="text-sm font-normal">
                      Overview
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="getting-started"
                      checked={sections.gettingStarted}
                      onCheckedChange={(checked) => handleSectionChange("gettingStarted", checked)}
                    />
                    <Label htmlFor="getting-started" className="text-sm font-normal">
                      Getting Started
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="installation"
                      checked={sections.installation}
                      onCheckedChange={(checked) => handleSectionChange("installation", checked)}
                    />
                    <Label htmlFor="installation" className="text-sm font-normal">
                      Installation
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="usage"
                      checked={sections.usage}
                      onCheckedChange={(checked) => handleSectionChange("usage", checked)}
                    />
                    <Label htmlFor="usage" className="text-sm font-normal">
                      Usage
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="api"
                      checked={sections.api}
                      onCheckedChange={(checked) => handleSectionChange("api", checked)}
                    />
                    <Label htmlFor="api" className="text-sm font-normal">
                      API Reference
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="examples"
                      checked={sections.examples}
                      onCheckedChange={(checked) => handleSectionChange("examples", checked)}
                    />
                    <Label htmlFor="examples" className="text-sm font-normal">
                      Examples
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="troubleshooting"
                      checked={sections.troubleshooting}
                      onCheckedChange={(checked) => handleSectionChange("troubleshooting", checked)}
                    />
                    <Label htmlFor="troubleshooting" className="text-sm font-normal">
                      Troubleshooting
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="contributing"
                      checked={sections.contributing}
                      onCheckedChange={(checked) => handleSectionChange("contributing", checked)}
                    />
                    <Label htmlFor="contributing" className="text-sm font-normal">
                      Contributing
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="license"
                      checked={sections.license}
                      onCheckedChange={(checked) => handleSectionChange("license", checked)}
                    />
                    <Label htmlFor="license" className="text-sm font-normal">
                      License
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={!projectName.trim() || !projectDescription.trim() || isGenerating}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                {isGenerating ? "Generating..." : "Generate Documentation"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Documentation Preview</CardTitle>
              <CardDescription>Review your generated documentation</CardDescription>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Generating documentation based on your configuration...</p>
                  </div>
                </div>
              ) : generatedDocs ? (
                <div className="relative">
                  <div className="prose prose-sm max-w-none dark:prose-invert p-4 rounded-md border overflow-auto max-h-[500px]">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: generatedDocs.replace(/\n/g, "<br>").replace(/```(.+?)```/gs, (match, code) => {
                          return `<pre><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`
                        }),
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center p-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <p>No documentation generated yet. Configure your settings and click "Generate Documentation".</p>
                </div>
              )}
            </CardContent>
            {generatedDocs && (
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("config")} className="gap-2">
                  Edit Configuration
                </Button>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    <FileText className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Documentation"}
                  </Button>
                  <Button onClick={handleDownload} variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download
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
