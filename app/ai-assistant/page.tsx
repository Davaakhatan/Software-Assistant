"use client"
import dynamic from "next/dynamic"

const AIAssistantPageContent = dynamic(
  () => import("./ai-assistant-content").then((mod) => mod.AIAssistantPageContent),
  {
    ssr: false,
  },
)

export default function AIAssistantPage() {
  return <AIAssistantPageContent />
}
