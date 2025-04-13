"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Check, Copy, Loader2 } from "lucide-react"

export function ApiKeyManager() {
  const { toast } = useToast()
  const [apiKey, setApiKey] = useState("")
  const [isTesting, setIsTesting] = useState(false)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    // Load API key from localStorage on mount
    const storedApiKey = localStorage.getItem("openai_api_key")
    if (storedApiKey) {
      setApiKey(storedApiKey)
    }
  }, [])

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value)
    setIsValid(false) // Reset validation status on change
  }

  const handleSaveApiKey = () => {
    localStorage.setItem("openai_api_key", apiKey)
    toast({
      title: "API key saved",
      description: "Your OpenAI API key has been saved successfully.",
    })
    setIsValid(false) // Reset validation status on save
  }

  const handleTestApiKey = async () => {
    setIsTesting(true)
    setIsValid(false)
    try {
      // Make sure apiKey is not empty before testing
      if (!apiKey || apiKey.trim() === "") {
        toast({
          title: "API key is empty",
          description: "Please enter an API key before testing",
          variant: "destructive",
        })
        setIsTesting(false)
        return
      }

      const response = await fetch(`/api/test-openai?key=${encodeURIComponent(apiKey)}`)
      const data = await response.json()

      if (data.success) {
        setIsValid(true)
        toast({
          title: "API key is valid",
          description: data.response,
        })
      } else {
        toast({
          title: "API key is invalid",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error testing API key:", error)
      toast({
        title: "Error testing API key",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(apiKey)
    toast({
      title: "Copied to clipboard",
      description: "API key copied to clipboard",
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="api-key">OpenAI API Key</Label>
        <div className="relative">
          <Input id="api-key" type="password" placeholder="sk-..." value={apiKey} onChange={handleApiKeyChange} />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-2 -translate-y-1/2"
            onClick={handleCopyToClipboard}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex justify-between">
        <Button onClick={handleSaveApiKey}>Save API Key</Button>
        <Button variant="secondary" onClick={handleTestApiKey} disabled={isTesting} className="flex items-center gap-2">
          {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Test API Key
        </Button>
      </div>

      {isValid && <div className="text-green-500">API key is valid!</div>}
    </div>
  )
}
