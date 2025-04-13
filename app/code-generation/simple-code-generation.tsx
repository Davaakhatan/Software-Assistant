"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SimpleCodeGeneration() {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for code generation",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      // Simulate code generation
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Example generated code
      const code = `// Generated code based on: ${prompt}
function exampleFunction() {
  console.log("This is a sample function");
  return "Hello, world!";
}

// This is just a placeholder
// In a real implementation, this would call the AI service
export default exampleFunction;`

      setGeneratedCode(code)

      toast({
        title: "Code generated",
        description: "Your code has been generated successfully",
      })
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
        <CardTitle>Simple Code Generation</CardTitle>
        <CardDescription>Generate code with a simple prompt</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt</Label>
          <Textarea
            id="prompt"
            placeholder="Describe the code you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        {generatedCode && (
          <div className="space-y-2">
            <Label htmlFor="generated-code">Generated Code</Label>
            <div className="relative">
              <Textarea
                id="generated-code"
                value={generatedCode}
                readOnly
                className="min-h-[200px] font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  navigator.clipboard.writeText(generatedCode)
                  toast({
                    title: "Copied",
                    description: "Code copied to clipboard",
                  })
                }}
              >
                Copy
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Code"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
