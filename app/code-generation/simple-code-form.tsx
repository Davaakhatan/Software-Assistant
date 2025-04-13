"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Loader2, CodeIcon, Save, Copy } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface SimpleCodeFormProps {
  specifications: any[]
  designs: any[]
}

export function SimpleCodeForm({ specifications, designs }: SimpleCodeFormProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("fromSpecDesign")
  const [specId, setSpecId] = useState("")
  const [designId, setDesignId] = useState("")
  const [manualRequirements, setManualRequirements] = useState("")
  const [language, setLanguage] = useState("typescript")
  const [framework, setFramework] = useState("nextjs")
  const [generatedCode, setGeneratedCode] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [fileName, setFileName] = useState("")

  // Simple function to generate placeholder code
  const generatePlaceholderCode = () => {
    console.log("Generating placeholder code...")

    const placeholderCode = `// Generated ${language} code for ${framework}
// Based on ${activeTab === "fromSpecDesign" ? `specification ${specId} and design ${designId}` : "manual requirements"}

function main() {
  console.log("Hello, world!");
  return "This is placeholder code generated at ${new Date().toISOString()}";
}

// Export the main function
export default main;`

    return placeholderCode
  }

  // Handle code generation
  const handleGenerate = () => {
    console.log("Generate button clicked")

    // Set loading state
    setIsGenerating(true)

    // Log the current state
    console.log("Current state:", {
      activeTab,
      specId,
      designId,
      manualRequirements,
      language,
      framework,
    })

    // Generate a default file name based on the selected options
    let defaultFileName = ""
    if (activeTab === "fromSpecDesign") {
      const selectedSpec = specifications.find((spec) => spec.id === specId)
      defaultFileName = selectedSpec ? `${selectedSpec.app_name}-${language}` : `code-${language}`
    } else {
      defaultFileName = `code-${language}-${framework}`
    }
    setFileName(defaultFileName)

    // Simulate API call with setTimeout
    setTimeout(() => {
      try {
        // Generate placeholder code
        const code = generatePlaceholderCode()

        // Update state with generated code
        setGeneratedCode(code)

        // Show success toast
        toast({
          title: "Code generated",
          description: "Your code has been successfully generated",
        })

        console.log("Code generation successful")
      } catch (error) {
        console.error("Error generating code:", error)

        // Show error toast
        toast({
          title: "Generation failed",
          description: "An unexpected error occurred",
          variant: "destructive",
        })
      } finally {
        // Reset loading state
        setIsGenerating(false)
      }
    }, 1000) // Simulate 1 second delay
  }

  // Handle save to files
  const handleSave = () => {
    console.log("Save button clicked")

    // Validate file name
    if (!fileName.trim()) {
      toast({
        title: "File name required",
        description: "Please enter a file name to save your code",
        variant: "destructive",
      })
      return
    }

    // Set loading state
    setIsSaving(true)

    // Simulate API call with setTimeout
    setTimeout(() => {
      try {
        console.log("Saving code to file:", fileName)

        // Show success toast
        toast({
          title: "Code saved",
          description: `Your code has been saved as "${fileName}"`,
        })

        console.log("Code save successful")
      } catch (error) {
        console.error("Error saving code:", error)

        // Show error toast
        toast({
          title: "Save failed",
          description: "An unexpected error occurred while saving",
          variant: "destructive",
        })
      } finally {
        // Reset loading state
        setIsSaving(false)
      }
    }, 1000) // Simulate 1 second delay
  }

  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard
      .writeText(generatedCode)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "Code has been copied to clipboard",
        })
      })
      .catch((error) => {
        console.error("Error copying to clipboard:", error)
        toast({
          title: "Copy failed",
          description: "Failed to copy code to clipboard",
          variant: "destructive",
        })
      })
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Generate Code</h2>
        <p className="text-muted-foreground mb-6">Generate code based on your specifications and designs</p>

        <Tabs defaultValue="fromSpecDesign" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="fromSpecDesign">From Specification & Design</TabsTrigger>
            <TabsTrigger value="manual">Enter Requirements Manually</TabsTrigger>
          </TabsList>

          <TabsContent value="fromSpecDesign" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="specification">Specification</Label>
                <Select value={specId} onValueChange={setSpecId}>
                  <SelectTrigger id="specification">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="design">Design</Label>
                <Select value={designId} onValueChange={setDesignId}>
                  <SelectTrigger id="design">
                    <SelectValue placeholder="Select a design" />
                  </SelectTrigger>
                  <SelectContent>
                    {designs.map((design) => (
                      <SelectItem key={design.id} value={design.id}>
                        {design.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language-spec">Programming Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language-spec">
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="csharp">C#</SelectItem>
                    <SelectItem value="go">Go</SelectItem>
                    <SelectItem value="rust">Rust</SelectItem>
                    <SelectItem value="php">PHP</SelectItem>
                    <SelectItem value="ruby">Ruby</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="framework-spec">Framework</Label>
                <Select value={framework} onValueChange={setFramework}>
                  <SelectTrigger id="framework-spec">
                    <SelectValue placeholder="Select a framework" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nextjs">Next.js</SelectItem>
                    <SelectItem value="react">React</SelectItem>
                    <SelectItem value="vue">Vue.js</SelectItem>
                    <SelectItem value="angular">Angular</SelectItem>
                    <SelectItem value="svelte">Svelte</SelectItem>
                    <SelectItem value="express">Express.js</SelectItem>
                    <SelectItem value="nestjs">NestJS</SelectItem>
                    <SelectItem value="django">Django</SelectItem>
                    <SelectItem value="flask">Flask</SelectItem>
                    <SelectItem value="spring">Spring Boot</SelectItem>
                    <SelectItem value="aspnet">ASP.NET Core</SelectItem>
                    <SelectItem value="laravel">Laravel</SelectItem>
                    <SelectItem value="rails">Ruby on Rails</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                placeholder="Enter your requirements here..."
                className="min-h-[150px]"
                value={manualRequirements}
                onChange={(e) => setManualRequirements(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language-manual">Programming Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language-manual">
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="csharp">C#</SelectItem>
                    <SelectItem value="go">Go</SelectItem>
                    <SelectItem value="rust">Rust</SelectItem>
                    <SelectItem value="php">PHP</SelectItem>
                    <SelectItem value="ruby">Ruby</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="framework-manual">Framework</Label>
                <Select value={framework} onValueChange={setFramework}>
                  <SelectTrigger id="framework-manual">
                    <SelectValue placeholder="Select a framework" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nextjs">Next.js</SelectItem>
                    <SelectItem value="react">React</SelectItem>
                    <SelectItem value="vue">Vue.js</SelectItem>
                    <SelectItem value="angular">Angular</SelectItem>
                    <SelectItem value="svelte">Svelte</SelectItem>
                    <SelectItem value="express">Express.js</SelectItem>
                    <SelectItem value="nestjs">NestJS</SelectItem>
                    <SelectItem value="django">Django</SelectItem>
                    <SelectItem value="flask">Flask</SelectItem>
                    <SelectItem value="spring">Spring Boot</SelectItem>
                    <SelectItem value="aspnet">ASP.NET Core</SelectItem>
                    <SelectItem value="laravel">Laravel</SelectItem>
                    <SelectItem value="rails">Ruby on Rails</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleGenerate} disabled={isGenerating} className="flex items-center gap-2">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <CodeIcon className="h-4 w-4" />
                Generate Code
              </>
            )}
          </Button>
        </div>
      </Card>

      {generatedCode && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Generated Code</h2>
          <div className="bg-muted p-4 rounded-md overflow-auto max-h-[500px] mb-6">
            <pre className="text-sm whitespace-pre-wrap">{generatedCode}</pre>
          </div>

          <div className="flex flex-col space-y-4">
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="file-name">File Name</Label>
                <Input
                  id="file-name"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Enter file name"
                />
              </div>
              <Button onClick={handleCopy} variant="outline" className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save to Files
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
