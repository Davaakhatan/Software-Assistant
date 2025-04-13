import { ApiKeyManager } from "@/components/api-key-manager"

export default function SettingsPage() {
  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">API Keys</h2>
          <div className="bg-white rounded-lg border p-6">
            <ApiKeyManager />
          </div>
        </div>
      </div>
    </div>
  )
}
