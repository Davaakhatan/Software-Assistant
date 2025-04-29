import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { MainNav } from "@/components/main-nav"
import { ThemeProvider } from "@/components/theme-provider"
import { AIProviderContextProvider } from "@/context/ai-provider-context"
import { AISettings } from "@/components/ai-settings"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "AI-Powered SDLC Companion",
  description: "A comprehensive AI tool for managing the software development lifecycle",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AIProviderContextProvider>
            <div className="flex min-h-screen flex-col">
              <header className="sticky top-0 z-40 border-b bg-background">
                <div className="container flex h-16 items-center">
                  <MainNav />
                </div>
              </header>
              <main className="flex-1 container py-6">{children}</main>
            </div>
            <AISettings />
            <Toaster />
          </AIProviderContextProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
