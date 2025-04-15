import type { Metadata } from "next"
import SetupTestCasesDatabase from "../setup-database"

export const metadata: Metadata = {
  title: "Testing Database Setup",
  description: "Set up the database tables for the testing module",
}

export default function TestingSetupPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Testing Database Setup</h1>
        <p className="text-muted-foreground">Set up the database tables required for the testing module</p>
      </div>

      <div className="space-y-6">
        <SetupTestCasesDatabase />
      </div>
    </div>
  )
}
