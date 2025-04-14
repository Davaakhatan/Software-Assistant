"\"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CodeIcon, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateCode } from "./actions"

export default function CodeGenerationForm() {
  const { toast } = useToast()
  const [language, setLanguage] = useState("typescript")
  const [framework, setFramework] = useState("nextjs")
  const [requirements, setRequirements] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const result = await generateCode(language, framework, requirements)

      if (result.success) {
        setGeneratedCode(result.code)
        toast({
          title: "Code generated",
          description: "Your code has been generated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to generate code",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate code",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Code Generation</CardTitle>
        <CardDescription>Generate code based on your requirements</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="framework">Framework</Label>
            <Select value={framework} onValueChange={setFramework}>
              <SelectTrigger>
                <SelectValue placeholder="Select framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nextjs">Next.js</SelectItem>
                <SelectItem value="react">React</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="requirements">Requirements</Label>
          <Textarea
            id="requirements"
            placeholder="Enter your requirements here"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            rows={5}
          />
        </div>

        {generatedCode && (
          <div className="space-y-2">
            <Label htmlFor="generated-code">Generated Code</Label>
            <Textarea id="generated-code" value={generatedCode} readOnly className="min-h-[200px] font-mono text-sm" />
          </div>
        )}
      </CardContent>
      <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <CodeIcon className="mr-2 h-4 w-4" />
            Generate Code
          </>
        )}
      </Button>
    </Card>
  )
}
