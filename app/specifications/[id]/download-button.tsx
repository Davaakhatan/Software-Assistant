"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function DownloadButton({ spec }) {
  const { toast } = useToast()

  const handleDownload = () => {
    // Create a text file with the specification
    const content = `# ${spec.app_name} System Specification

## Application Overview
${spec.app_description}

## Target Audience
${spec.target_audience}

## Key Features
${spec.key_features}

## Technical Constraints
${spec.technical_constraints}

${
  spec.functional_requirements
    ? `## Functional Requirements
${spec.functional_requirements}
`
    : ""
}

${
  spec.non_functional_requirements
    ? `## Non-Functional Requirements
${spec.non_functional_requirements}
`
    : ""
}

${
  spec.system_architecture
    ? `## System Architecture
${spec.system_architecture}
`
    : ""
}

${
  spec.api_design
    ? `## API Design
${spec.api_design}
`
    : ""
}

${
  spec.database_schema
    ? `## Database Schema
${spec.database_schema}
`
    : ""
}

${
  spec.scalability_considerations
    ? `## Scalability & Performance Considerations
${spec.scalability_considerations}
`
    : ""
}

${
  spec.security_considerations
    ? `## Security Considerations
${spec.security_considerations}
`
    : ""
}

${
  spec.deployment_plan
    ? `## Deployment Plan
${spec.deployment_plan}
`
    : ""
}

${
  spec.monitoring_logging
    ? `## Monitoring & Logging
${spec.monitoring_logging}
`
    : ""
}

${
  spec.future_enhancements
    ? `## Future Enhancements
${spec.future_enhancements}
`
    : ""
}
`

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${spec.app_name.replace(/\s+/g, "-").toLowerCase()}-specification.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Specification downloaded",
      description: "Your specification has been downloaded as a Markdown file.",
    })
  }

  return (
    <Button onClick={handleDownload} className="gap-2">
      <Download className="h-4 w-4" />
      Download
    </Button>
  )
}
