"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sparkles, FileText, Settings, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

export function MainNav() {
  const pathname = usePathname()

  return (
    <div className="mr-4 flex">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <span className="hidden font-bold sm:inline-block">SDLC Companion</span>
        <Sparkles className="h-4 w-4 text-blue-500" />
      </Link>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        <Link
          href="/specification-generator"
          className={cn(
            "transition-colors hover:text-foreground/80 flex items-center gap-1",
            pathname === "/specification-generator" ? "text-foreground" : "text-foreground/60",
          )}
        >
          <Sparkles className="h-3 w-3 text-blue-500" />
          Specification Generator
        </Link>
        <Link
          href="/design"
          className={cn(
            "transition-colors hover:text-foreground/80 flex items-center gap-1",
            pathname === "/design" ? "text-foreground" : "text-foreground/60",
          )}
        >
          <Sparkles className="h-3 w-3 text-blue-500" />
          Design
        </Link>
        <Link
          href="/code-generation"
          className={cn(
            "transition-colors hover:text-foreground/80 flex items-center gap-1",
            pathname === "/code-generation" ? "text-foreground" : "text-foreground/60",
          )}
        >
          <Sparkles className="h-3 w-3 text-blue-500" />
          Code
        </Link>
        <Link
          href="/testing"
          className={cn(
            "transition-colors hover:text-foreground/80 flex items-center gap-1",
            pathname === "/testing" ? "text-foreground" : "text-foreground/60",
          )}
        >
          <Sparkles className="h-3 w-3 text-blue-500" />
          Testing
        </Link>
        <Link
          href="/cicd"
          className={cn(
            "transition-colors hover:text-foreground/80 flex items-center gap-1",
            pathname === "/cicd" ? "text-foreground" : "text-foreground/60",
          )}
        >
          <Sparkles className="h-3 w-3 text-blue-500" />
          CI/CD
        </Link>
        <Link
          href="/documentation"
          className={cn(
            "transition-colors hover:text-foreground/80 flex items-center gap-1",
            pathname === "/documentation" ? "text-foreground" : "text-foreground/60",
          )}
        >
          <Sparkles className="h-3 w-3 text-blue-500" />
          Documentation
        </Link>
        <Link
          href="/files"
          className={cn(
            "transition-colors hover:text-foreground/80 flex items-center gap-1",
            pathname === "/files" ? "text-foreground" : "text-foreground/60",
          )}
        >
          <FileText className="h-3 w-3 text-green-500" />
          Files
        </Link>
        <Link
          href="/ai-assistant"
          className={cn(
            "transition-colors hover:text-foreground/80 flex items-center gap-1",
            pathname === "/ai-assistant" ? "text-foreground" : "text-foreground/60",
          )}
        >
          <MessageSquare className="h-3 w-3 text-purple-500" />
          AI Chat
        </Link>
        <Link
          href="/settings"
          className={cn(
            "transition-colors hover:text-foreground/80 flex items-center gap-1",
            pathname === "/settings" ? "text-foreground" : "text-foreground/60",
          )}
        >
          <Settings className="h-3 w-3 text-gray-500" />
          Settings
        </Link>
      </nav>
    </div>
  )
}
