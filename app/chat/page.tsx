import { ChatInterface } from "./chat-interface"

export default function ChatPage() {
  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">AI Chat</h1>
      <p className="text-gray-600 mb-6">
        Use this chat interface to test your OpenAI API key and interact with the AI assistant.
      </p>

      <div className="bg-white rounded-lg border p-6">
        <ChatInterface />
      </div>
    </div>
  )
}
