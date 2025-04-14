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
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "info" | "error" | null }>({
    text: "",
    type: null,
  })

  useEffect(() => {
    // Load API key from localStorage on mount
    const storedApiKey = localStorage.getItem("openai_api_key")
    if (storedApiKey) {
      setApiKey(storedApiKey)
    }
  }, [])

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value)
    setStatusMessage({ text: "", type: null }) // Reset status message on change
  }

  const handleSaveApiKey = () => {
    localStorage.setItem("openai_api_key", apiKey)
    setStatusMessage({
      text: "API key successfully saved to local storage!",
      type: "success",
    })
    toast({
      title: "API key saved",
      description: "Your OpenAI API key has been saved successfully.",
    })
  }

  const handleTestApiKey = async () => {
    setIsTesting(true)
    setStatusMessage({ text: "", type: null })
    try {
      // Make sure apiKey is not empty before testing
      if (!apiKey || apiKey.trim() === "") {
        toast({
          title: "API key is empty",
          description: "Please enter an API key before testing",
          variant: "destructive",
        })
        setStatusMessage({
          text: "API key cannot be empty",
          type: "error",
        })
        setIsTesting(false)
        return
      }

      const response = await fetch(`/api/test-openai?key=${encodeURIComponent(apiKey)}`)
      const data = await response.json()

      if (data.success) {
        // Automatically save the API key when it's valid
        localStorage.setItem("openai_api_key", apiKey)
        setStatusMessage({
          text: "API key is valid and has been saved!",
          type: "success",
        })
        toast({
          title: "API key is valid and saved",
          description: "Your API key has been tested successfully and saved to local storage.",
        })
      } else {
        setStatusMessage({
          text: "API key is invalid: " + data.error,
          type: "error",
        })
        toast({
          title: "API key is invalid",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error testing API key:", error)
      setStatusMessage({
        text: "Error testing API key: " + (error instanceof Error ? error.message : "An unexpected error occurred"),
        type: "error",
      })
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

      {statusMessage.type && (
        <div
          className={`mt-2 ${
            statusMessage.type === "success"
              ? "text-green-500"
              : statusMessage.type === "error"
                ? "text-red-500"
                : "text-blue-500"
          }`}
        >
          {statusMessage.text}
        </div>
      )}
    </div>
  )
}
