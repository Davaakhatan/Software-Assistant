import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Redirect /cicd/saved to /cicd/pipelines-saved
  if (request.nextUrl.pathname === "/cicd/saved") {
    return NextResponse.redirect(new URL("/cicd/pipelines-saved", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/cicd/saved"],
}
