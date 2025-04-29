"use client"

import { CardFooter } from "@/components/ui/card"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { getDocumentation } from "./actions"
import { formatDate } from "@/lib/utils"
import { getSupabase } from "@/lib/supabase" // Import the client-side Supabase client

export default function SavedDocumentation() {
  const [documentationList, setDocumentationList] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDocumentation = async () => {
      setIsLoading(true)
      try {
        const supabase = getSupabase() // Use the client-side Supabase client
        const result = await getDocumentation()
        if (result.success) {
          setDocumentationList(result.data || [])
        } else {
          console.error("Failed to load documentation:", result.error)
        }
      } catch (error) {
        console.error("Error fetching documentation:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocumentation()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Saved Documentation</CardTitle>
          <CardDescription>View and manage your saved documentation</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading documentation...</p>
          ) : documentationList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documentationList.map((doc) => (
                <Card key={doc.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle>{doc.project_name}</CardTitle>
                    <CardDescription>
                      {doc.doc_type}
                      <br />
                      Created on {formatDate(doc.created_at)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="line-clamp-3">{doc.project_description}</p>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/documentation/${doc.id}`} className="w-full">
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p>No documentation saved yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
