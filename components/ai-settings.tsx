"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Settings, X, Sparkles, HelpCircle } from "lucide-react"
import { useAIProvider } from "@/context/ai-provider-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface AISettingsProps {
  alwaysShow?: boolean
}

export function AISettings({ alwaysShow = false }: AISettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { provider, setProvider, temperature, setTemperature } = useAIProvider()

  if (alwaysShow) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              AI Provider Settings
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">AI Provider</Label>
              <RadioGroup value={provider} onValueChange={(value) => setProvider(value as "openai" | "deepseek")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="openai" id="openai-fixed" />
                  <Label htmlFor="openai-fixed">OpenAI (GPT-4o)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="deepseek" id="deepseek-fixed" />
                  <Label htmlFor="deepseek-fixed">DeepSeek Chat</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <div className="flex justify-between mb-2 items-center">
                <div className="flex items-center gap-1">
                  <Label>Temperature: {temperature.toFixed(1)}</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full">
                          <HelpCircle className="h-3 w-3" />
                          <span className="sr-only">Temperature explanation</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          Temperature controls the randomness of the AI's responses. Lower values (0.0-0.3) make the AI
                          more deterministic and focused, ideal for factual or technical content. Higher values
                          (0.7-1.0) make responses more creative and varied, better for brainstorming or creative
                          writing.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <Slider
                value={[temperature]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={(value) => setTemperature(value[0])}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="fixed bottom-4 right-4 z-50 gap-2">
        <Settings className="h-4 w-4" />
        AI Settings
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            AI Settings
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">AI Provider</Label>
            <RadioGroup value={provider} onValueChange={(value) => setProvider(value as "openai" | "deepseek")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="openai" id="openai" />
                <Label htmlFor="openai">OpenAI (GPT-4o)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="deepseek" id="deepseek" />
                <Label htmlFor="deepseek">DeepSeek Chat</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <div className="flex justify-between mb-2 items-center">
              <div className="flex items-center gap-1">
                <Label>Temperature: {temperature.toFixed(1)}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full">
                        <HelpCircle className="h-3 w-3" />
                        <span className="sr-only">Temperature explanation</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        Temperature controls the randomness of the AI's responses. Lower values (0.0-0.3) make the AI
                        more deterministic and focused, ideal for factual or technical content. Higher values (0.7-1.0)
                        make responses more creative and varied, better for brainstorming or creative writing.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <Slider
              value={[temperature]}
              min={0}
              max={1}
              step={0.1}
              onValueChange={(value) => setTemperature(value[0])}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
