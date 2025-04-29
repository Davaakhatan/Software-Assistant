import { type NextRequest, NextResponse } from "next/server"
import { generateArchitectureDiagram } from "@/lib/ai-service"

// Default diagrams for different application types
const DEFAULT_DIAGRAMS = {
  web: `graph TD
  subgraph Frontend
    A[Web Browser]
    B[ReactJS App]
  end
  
  subgraph Backend
    C[API Gateway]
    D[Node.js Server]
    E[Authentication Service]
  end
  
  subgraph Data_Storage
    F[SQL Database]
    G[Cache]
  end
  
  A --> B
  B --> C
  C --> D
  C --> E
  D --> F
  D --> G
  E --> F`,

  mobile: `graph TD
  subgraph Client
    A[Mobile App]
    B[Local Storage]
  end
  
  subgraph Backend
    C[API Gateway]
    D[Application Server]
    E[Auth Service]
  end
  
  subgraph Data_Layer
    F[Database]
    G[CDN]
  end
  
  A --> B
  A --> C
  C --> D
  C --> E
  D --> F
  D --> G
  E --> F`,

  ecommerce: `graph TD
  subgraph Frontend
    A[Web Browser]
    B[Mobile App]
  end
  
  subgraph Backend
    C[API Gateway]
    D[Product Service]
    E[Order Service]
    F[Payment Service]
    G[User Service]
  end
  
  subgraph Data_Storage
    H[Product DB]
    I[Order DB]
    J[User DB]
    K[Cache]
  end
  
  A --> C
  B --> C
  C --> D
  C --> E
  C --> F
  C --> G
  D --> H
  E --> I
  G --> J
  D --> K
  E --> K`,
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, appType = "web", apiKey } = await request.json()

    // Validate input
    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 })
    }

    // Check if API key is provided
    if (!apiKey || !apiKey.startsWith("sk-")) {
      console.log("API key missing or invalid, using fallback diagram")
      // Return a fallback diagram based on the app type
      return NextResponse.json({
        success: true,
        diagram: DEFAULT_DIAGRAMS[appType.toLowerCase()] || DEFAULT_DIAGRAMS.web,
        fromFallback: true,
      })
    }

    // Generate the diagram using the AI service
    const result = await generateArchitectureDiagram(
      "App", // Generic app name
      appType,
      "Application", // Generic description
      {
        apiKey, // Pass the API key
        temperature: 0.7,
        timeoutMs: 15000, // 15 second timeout
      },
    )

    if (result.success && result.diagram) {
      return NextResponse.json({
        success: true,
        diagram: result.diagram,
      })
    } else {
      console.log("AI generation failed, using fallback diagram:", result.error)
      // Return a fallback diagram based on the app type
      return NextResponse.json({
        success: true,
        diagram: DEFAULT_DIAGRAMS[appType.toLowerCase()] || DEFAULT_DIAGRAMS.web,
        fromFallback: true,
      })
    }
  } catch (error) {
    console.error("Error in generate-diagram API route:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
