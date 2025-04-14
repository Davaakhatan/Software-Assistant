"use client"

import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileCode } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { DeleteButton } from "./delete-button"

interface CardHeaderWithDeleteProps {
  id: string
  language: string
  framework: string
  createdAt?: string
}

export function CardHeaderWithDelete({ id, language, framework, createdAt }: CardHeaderWithDeleteProps) {
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
      <DeleteButton id={id} />
    </CardHeader>
  )
}
