import { openai } from "@ai-sdk/openai"
import { createOpenAI as createDeepSeek } from "@ai-sdk/openai"
import { streamText } from "ai"

// Create a DeepSeek provider using the OpenAI-compatible interface
const deepseek = createDeepSeek({
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY || "",
  compatibility: "compatible", // Use compatible mode for third-party providers
})

export async function POST(req: Request) {
  const { messages, provider = "openai", systemPrompt = "" } = await req.json()

  // Choose the provider based on the request
  const model = provider === "deepseek" ? deepseek("deepseek-chat") : openai("gpt-4o")

  const result = await streamText({
    model,
    messages,
    system: systemPrompt, // Use the system prompt if provided
  })

  return result.toDataStreamResponse()
}
