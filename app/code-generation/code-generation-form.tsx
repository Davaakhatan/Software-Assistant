"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { generateCode, generateFromSpecificationAndDesign } from "./actions"
import { Loader2 } from "lucide-react"

// Programming languages and frameworks options
const LANGUAGES = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
]

const FRAMEWORKS = [
  { value: "nextjs", label: "Next.js" },
  { value: "react", label: "React" },
  { value: "vue", label: "Vue.js" },
  { value: "angular", label: "Angular" },
  { value: "svelte", label: "Svelte" },
  { value: "express", label: "Express.js" },
  { value: "nestjs", label: "NestJS" },
  { value: "django", label: "Django" },
  { value: "flask", label: "Flask" },
  { value: "spring", label: "Spring Boot" },
  { value: "aspnet", label: "ASP.NET Core" },
  { value: "laravel", label: "Laravel" },
  { value: "rails", label: "Ruby on Rails" },
]

export default function CodeGenerationForm({
  specifications,
  designs,
}: {
  specifications: { id: string; app_name: string }[]
  designs: { id: string; name: string }[]
}) {
  const [activeTab, setActiveTab] = useState("spec-design")
  const [specificationId, setSpecificationId] = useState<string>("none")
  const [designId, setDesignId] = useState<string>("none")
  const [requirements, setRequirements] = useState<string>("")
  const [language, setLanguage] = useState<string>("typescript")
  const [framework, setFramework] = useState<string>("nextjs")
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [generatedCode, setGeneratedCode] = useState<string>("")
  const [error, setError] = useState<string>("")

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError("")
    setGeneratedCode("")

    try {
      if (activeTab === "spec-design") {
        const result = await generateFromSpecificationAndDesign(specificationId, designId, language, framework)
        if (result.success) {
          setGeneratedCode(result.code)
        } else {
          setError(result.error || "Failed to generate code")
        }
      } else {
        if (!requirements.trim()) {
          setError("Please enter requirements")
          setIsGenerating(false)
          return
        }

        const result = await generateCode(language, framework, requirements)
        if (result.success) {
          setGeneratedCode(result.code)
        } else {
          setError(result.error || "Failed to generate code")
        }
      }
    } catch (err) {
      console.error("Error generating code:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Code</CardTitle>
          <CardDescription>Generate code based on your specifications and designs</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="spec-design">From Specification & Design</TabsTrigger>
              <TabsTrigger value="manual">Enter Requirements Manually</TabsTrigger>
            </TabsList>
            <TabsContent value="spec-design" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specification">Specification</Label>
                  <Select value={specificationId} onValueChange={setSpecificationId}>
                    <SelectTrigger id="specification">
                      <SelectValue placeholder="Select a specification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
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
                      <SelectItem value="none">None</SelectItem>
                      {designs.map((design) => (
                        <SelectItem key={design.id} value={design.id}>
                          {design.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Add language and framework selectors for spec-design tab */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="language-spec">Programming Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language-spec">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
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
                      {FRAMEWORKS.map((fw) => (
                        <SelectItem key={fw.value} value={fw.value}>
                          {fw.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="manual" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  placeholder="Enter your requirements here..."
                  className="min-h-[150px]"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                />
              </div>

              {/* Language and framework selectors for manual tab */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="language-manual">Programming Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language-manual">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
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
                      {FRAMEWORKS.map((fw) => (
                        <SelectItem key={fw.value} value={fw.value}>
                          {fw.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-6">
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Code"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      {generatedCode && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Code</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-auto max-h-[500px]">
              <code>{generatedCode}</code>
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
