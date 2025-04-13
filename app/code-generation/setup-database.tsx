"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Check, Database, Copy, ExternalLink } from "lucide-react"
import { getSupabase } from "@/lib/supabase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

export default function SetupDatabase() {
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState("instructions")

  // SQL to create the execute_sql function
  const createFunctionSQL = `
-- Create a function to execute arbitrary SQL (use with caution)
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE sql_query INTO result;
  RETURN result;
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.execute_sql TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_sql TO service_role;
  `

  // SQL to create the generated_code table
  const createTableSQL = `
CREATE TABLE IF NOT EXISTS public.generated_code (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  language TEXT DEFAULT 'typescript',
  framework TEXT DEFAULT 'nextjs',
  requirements TEXT,
  extracted_code TEXT NOT NULL,
  specification_id UUID,
  design_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Make sure we have the uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  `

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "SQL has been copied to your clipboard",
    })
  }

  const checkTableExists = async () => {
    setIsCreating(true)
    setStatus("idle")
    setMessage("")

    try {
      const supabase = getSupabase()

      // Try to query the table directly to see if it exists
      const { data, error } = await supabase.from("generated_code").select("id").limit(1)

      if (error && error.message.includes("does not exist")) {
        setStatus("error")
        setMessage("The 'generated_code' table doesn't exist. Please follow the instructions to create it.")
      } else {
        setStatus("success")
        setMessage("The 'generated_code' table already exists! You can use database storage now.")
      }
    } catch (error) {
      console.error("Error checking table:", error)
      setStatus("error")
      setMessage("Failed to check if table exists. Please follow the manual setup instructions.")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Setup
        </CardTitle>
        <CardDescription>Set up the required database table for storing generated code</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="instructions">Setup Instructions</TabsTrigger>
            <TabsTrigger value="check">Check Status</TabsTrigger>
          </TabsList>

          <TabsContent value="instructions" className="space-y-4 mt-4">
            <p className="text-sm text-gray-500">
              The application is currently using browser storage because the required database table doesn't exist.
              Follow these steps to set up the database:
            </p>

            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Step 1: Create the execute_sql function</h3>
                <p className="text-sm text-gray-500 mb-2">Open the Supabase SQL Editor and run the following SQL:</p>
                <div className="bg-gray-50 p-3 rounded-md relative">
                  <pre className="text-xs overflow-auto whitespace-pre-wrap">{createFunctionSQL}</pre>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(createFunctionSQL)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Step 2: Create the generated_code table</h3>
                <p className="text-sm text-gray-500 mb-2">In the same SQL Editor, run the following SQL:</p>
                <div className="bg-gray-50 p-3 rounded-md relative">
                  <pre className="text-xs overflow-auto whitespace-pre-wrap">{createTableSQL}</pre>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(createTableSQL)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Step 3: Verify setup</h3>
                <p className="text-sm text-gray-500 mb-2">
                  After running both SQL scripts, switch to the "Check Status" tab to verify the setup.
                </p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    setActiveTab("check")
                    checkTableExists()
                  }}
                >
                  Go to Check Status
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => window.open("https://supabase.com/dashboard", "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                Open Supabase Dashboard
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="check" className="space-y-4 mt-4">
            <p className="text-sm text-gray-500 mb-4">Check if the database table has been set up correctly:</p>

            {status === "success" && (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Success</AlertTitle>
                <AlertDescription className="text-green-700">{message}</AlertDescription>
              </Alert>
            )}

            {status === "error" && (
              <Alert className="mb-4" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <Button onClick={checkTableExists} disabled={isCreating} className="w-full">
              {isCreating ? "Checking..." : "Check Database Setup"}
            </Button>

            {status === "error" && (
              <Button variant="outline" className="w-full mt-2" onClick={() => setActiveTab("instructions")}>
                Return to Setup Instructions
              </Button>
            )}

            {status === "success" && (
              <Button variant="outline" className="w-full mt-2" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
