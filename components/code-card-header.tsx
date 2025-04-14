"use client"

import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileCode } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { DeleteCodeButton } from "@/components/delete-code-button"

interface CodeCardHeaderProps {
  id: string
  language: string
  framework: string
  createdAt?: string
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>
}

export function CodeCardHeader({ id, language, framework, createdAt, onDelete }: CodeCardHeaderProps) {
  return (
    <CardHeader className="flex flex-row items-start justify-between">
      <div>
        <CardTitle className="flex items-center">
          <FileCode className="mr-2 h-5 w-5" />
          <span className="truncate">
            {language} / {framework}
          </span>
        </CardTitle>
        <CardDescription>
          {createdAt && <span>Created {formatDistanceToNow(new Date(createdAt))} ago</span>}
        </CardDescription>
      </div>
      <DeleteCodeButton id={id} onDelete={onDelete} />
    </CardHeader>
  )
}
