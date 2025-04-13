"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SetupDatabaseClient() {
  const { toast } = useToast()
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const handleSetupDatabase = async () => {
    setIsSettingUp(true)

    try {
      const response = await fetch("/api/setup-database", {
        method: "POST",
      })

      if (response.ok) {
        setIsComplete(true)
        toast({
          title: "Success",
          description: "Database setup completed successfully",
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to setup database")
      }
    } catch (error) {
      console.error("Error setting up database:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSettingUp(false)
    }
  }

  if (isComplete) {
    return null
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Database Setup</CardTitle>
        <CardDescription>Set up the necessary database tables for code generation</CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          Before generating code, you need to set up the required database tables. This will create the necessary tables
          to store generated code and related information.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSetupDatabase} disabled={isSettingUp}>
          {isSettingUp ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up...
            </>
          ) : (
            "Setup Database"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
