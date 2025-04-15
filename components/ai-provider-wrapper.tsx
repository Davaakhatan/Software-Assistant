"use client"

import type React from "react"

import dynamic from "next/dynamic"

const AIProviderContextProvider = dynamic(
  () => import("@/context/ai-provider-context").then((mod) => mod.AIProviderContextProvider),
  { ssr: false },
)

interface AIProviderWrapperProps {
  children: React.ReactNode
}

export function AIProviderWrapper({ children }: AIProviderWrapperProps) {
  return <AIProviderContextProvider>{children}</AIProviderContextProvider>
}
