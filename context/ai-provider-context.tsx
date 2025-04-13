"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { AIProvider } from "@/lib/ai-service"

interface AIProviderContextType {
  provider: AIProvider
  setProvider: (provider: AIProvider) => void
  temperature: number
  setTemperature: (temperature: number) => void
}

const AIProviderContext = createContext<AIProviderContextType | undefined>(undefined)

export function AIProviderContextProvider({ children }: { children: React.ReactNode }) {
  // Try to load from localStorage on client side
  const [provider, setProviderState] = useState<AIProvider>("openai")
  const [temperature, setTemperatureState] = useState(0.7)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedProvider = localStorage.getItem("aiProvider") as AIProvider
    const savedTemperature = localStorage.getItem("aiTemperature")

    if (savedProvider) {
      setProviderState(savedProvider)
    }

    if (savedTemperature) {
      setTemperatureState(Number.parseFloat(savedTemperature))
    }
  }, [])

  // Save settings to localStorage when they change
  const setProvider = (newProvider: AIProvider) => {
    setProviderState(newProvider)
    localStorage.setItem("aiProvider", newProvider)
  }

  const setTemperature = (newTemperature: number) => {
    setTemperatureState(newTemperature)
    localStorage.setItem("aiTemperature", newTemperature.toString())
  }

  return (
    <AIProviderContext.Provider value={{ provider, setProvider, temperature, setTemperature }}>
      {children}
    </AIProviderContext.Provider>
  )
}

export function useAIProvider() {
  const context = useContext(AIProviderContext)
  if (context === undefined) {
    throw new Error("useAIProvider must be used within an AIProviderContextProvider")
  }
  return context
}
