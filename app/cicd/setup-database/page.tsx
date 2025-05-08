import SetupDatabase from "../setup-database"

export default function SetupDatabasePage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Database Setup</h1>
      <p className="text-muted-foreground mb-8">Set up the required database tables for storing CI/CD pipelines</p>

      <SetupDatabase />
    </div>
  )
}
