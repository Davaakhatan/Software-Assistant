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
import { Download, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getSpecifications, getSpecificationById } from "../specification-generator/actions"
import { getDesigns } from "../design/actions"
import { getSupabase } from "@/lib/supabase"
import { saveDocumentation } from "./actions"

export default function DocumentationGenerator() {
  const { toast } = useToast()
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
  const [activeTab, setActiveTab] = useState("config")
  const [documentationType, setDocumentationType] = useState("user")
  const [documentationContent, setDocumentationContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [documentationName, setDocumentationName] = useState("")

  // Added for integration with specifications and designs
  const [specificationsList, setSpecificationsList] = useState([])
  const [selectedSpecificationId, setSelectedSpecificationId] = useState("")
  const [isLoadingSpecifications, setIsLoadingSpecifications] = useState(true)
  const [designsList, setDesignsList] = useState([])
  const [selectedDesignId, setSelectedDesignId] = useState("")
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false)

  const handleSectionChange = (section, checked) => {
    setSections({
      ...sections,
      [section]: checked,
    })
  }

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
        // First, find a requirement linked to this specification
        const supabase = getSupabase()
        const { data: requirement, error: requirementError } = await supabase
          .from("requirements")
          .select("id")
          .eq("specification_id", selectedSpecificationId)
          .maybeSingle()

        if (requirementError || !requirement) {
          // No linked requirement found, so no designs
          setDesignsList([])
          return
        }

        // Now get designs for this requirement
        const result = await getDesigns()
        if (result.success) {
          // Filter designs to only include those for this requirement
          const filteredDesigns = result.data.filter(
            (design) => design.project_id && requirement.id === design.requirement_id,
          )
          setDesignsList(filteredDesigns || [])
        } else {
          console.error("Failed to load designs:", result.error)
        }
      } catch (error) {
        console.error("Error fetching designs:", error)
      } finally {
        setIsLoadingDesigns(false)
      }
    }

    fetchDesigns()
  }, [selectedSpecificationId])

  // Function to generate documentation from specification
  const generateFromSpecification = async () => {
    if (!selectedSpecificationId) {
      toast({
        title: "Error",
        description: "Please select a specification to generate documentation from.",
      })
      return
    }

    setIsGenerating(true)
    setActiveTab("preview")

    try {
      const result = await getSpecificationById(selectedSpecificationId)
      if (result.success && result.data) {
        // Simulate documentation generation delay
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Generate documentation content based on the specification
        const specification = result.data
        const generatedContent = `# ${specification.title} Documentation

## Overview

${specification.description}

### Use Cases

${specification.use_cases}

### Acceptance Criteria

${specification.acceptance_criteria}
`
        setGeneratedDocs(generatedContent)
        toast({
          title: "Documentation generated",
          description: "Documentation generated from specification successfully.",
        })
      } else {
        console.error("Failed to load specification:", result.error)
        toast({
          title: "Error",
          description: "Failed to generate documentation from specification.",
        })
      }
    } catch (error) {
      console.error("Error generating documentation:", error)
      toast({
        title: "Error",
        description: "An error occurred while generating documentation.",
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
      })
      return
    }

    setIsSaving(true)
    try {
      const result = await saveDocumentation({
        name: documentationName,
        type: documentationType,
        content: generatedDocs,
      })

      if (result.success) {
        toast({
          title: "Documentation saved",
          description: "Your documentation has been saved successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to save documentation.",
        })
      }
    } catch (error) {
      console.error("Error saving documentation:", error)
      toast({
        title: "Error",
        description: "An error occurred while saving documentation.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = () => {
    // In a real app, this would download the generated documentation
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
\`\`\`

#### POST /api/users

Creates a new user.

**Request Body:**

\`\`\`json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword"
}
\`\`\`

**Response:**

\`\`\`json
{
  "id": "2",
  "name": "Jane Doe",
  "email": "jane@example.com"
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
            <CardFooter>
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
                <Button onClick={handleDownload} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Documentation
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
