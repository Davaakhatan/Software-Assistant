"use client"

import { useState } from "react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function AIAssistantPage() {
  const [provider, setProvider] = useState<"openai" | "deepseek">("openai")
  const [activeTab, setActiveTab] = useState("general")

  const systemPrompts = {
    general:
      "You are an AI assistant for software development. Help the user with their software development questions.",
    requirements:
      "You are a requirements analyst. Help the user define clear, specific, and testable requirements for their software project.",
    design:
      "You are a system architect. Help the user design robust, scalable, and maintainable software architecture.",
    code: "You are a coding assistant. Help the user write clean, efficient, and well-documented code.",
    testing:
      "You are a QA specialist. Help the user create comprehensive test plans and test cases for their software.",
    cicd: "You are a DevOps engineer. Help the user set up and optimize CI/CD pipelines for their software project.",
  }

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    body: {
      provider,
      systemPrompt: systemPrompts[activeTab as keyof typeof systemPrompts],
    },
    onFinish: () => {
      // Scroll to bottom after message is received
      setTimeout(() => {
        const chatContainer = document.getElementById("chat-container")
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight
        }
      }, 100)
    },
  })

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Clear messages when changing tabs
    setMessages([])
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/" className="mr-4">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">AI Assistant</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Assistant Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">AI Provider</label>
                <Select value={provider} onValueChange={(value: "openai" | "deepseek") => setProvider(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
                    <SelectItem value="deepseek">DeepSeek Chat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Assistant Mode</label>
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid grid-cols-2 mb-2">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="requirements">Requirements</TabsTrigger>
                  </TabsList>
                  <TabsList className="grid grid-cols-2 mb-2">
                    <TabsTrigger value="design">Design</TabsTrigger>
                    <TabsTrigger value="code">Code</TabsTrigger>
                  </TabsList>
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="testing">Testing</TabsTrigger>
                    <TabsTrigger value="cicd">CI/CD</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="h-[80vh] flex flex-col">
            <CardHeader className="border-b">
              <CardTitle>
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Assistant
                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin inline" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto p-4" id="chat-container">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground p-4">
                    <p>Ask me anything about {activeTab} in your software development project.</p>
                  </div>
                )}

                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-2 ${
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t p-4">
              <form onSubmit={handleSubmit} className="w-full">
                <div className="flex flex-col space-y-2">
                  <Textarea
                    value={input}
                    onChange={handleInputChange}
                    placeholder={`Ask about ${activeTab} in your project...`}
                    className="min-h-[80px] resize-none"
                    disabled={isLoading}
                  />
                  <Button type="submit" className="self-end" disabled={isLoading}>
                    {isLoading ? "Thinking..." : "Send"}
                  </Button>
                </div>
              </form>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
