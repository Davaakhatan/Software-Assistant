"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { jsPDF } from "jspdf"
import { marked } from "marked"

export default function DownloadButton({ id, documentation }: { id: string; documentation: any }) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)

    try {
      // Use the documentation that was already passed to the component
      if (!documentation) {
        throw new Error("Documentation not available")
      }

      // Create markdown content
      const markdownContent = `# ${documentation.project_name}
Type: ${documentation.doc_type}
Created: ${new Date(documentation.created_at).toLocaleString()}

## Project Description
${documentation.project_description || "No description provided"}

## Documentation Content
${documentation.generated_docs}
      `.trim()

      // Convert markdown to HTML
      const htmlContent = marked.parse(markdownContent)

      // Create a new PDF document
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Add custom fonts
      pdf.setFont("helvetica")

      // Split the content into pages
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20 // margin in mm
      const lineHeight = 7 // line height in mm
      const effectiveWidth = pageWidth - 2 * margin
      const effectiveHeight = pageHeight - 2 * margin

      // Parse the HTML content
      const tempDiv = document.createElement("div")
      tempDiv.innerHTML = htmlContent

      let y = margin
      let currentPage = 1

      // Function to add a new page
      const addNewPage = () => {
        pdf.addPage()
        currentPage++
        y = margin
      }

      // Process each element
      const processNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          if (node.textContent.trim()) {
            const lines = pdf.splitTextToSize(node.textContent.trim(), effectiveWidth)
            for (const line of lines) {
              if (y > pageHeight - margin) {
                addNewPage()
              }
              pdf.text(line, margin, y)
              y += lineHeight
            }
            y += 2 // Add some space after text
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // Handle different element types
          if (node.tagName === "H1") {
            if (y > pageHeight - margin - 10) {
              addNewPage()
            }
            pdf.setFontSize(24)
            pdf.setTextColor(0, 0, 255) // Blue color for h1
            const lines = pdf.splitTextToSize(node.textContent.trim(), effectiveWidth)
            for (const line of lines) {
              pdf.text(line, margin, y)
              y += 10
            }
            y += 5
            pdf.setFontSize(12)
            pdf.setTextColor(0, 0, 0) // Reset to black
          } else if (node.tagName === "H2") {
            if (y > pageHeight - margin - 8) {
              addNewPage()
            }
            pdf.setFontSize(18)
            pdf.setTextColor(0, 0, 150) // Darker blue for h2
            const lines = pdf.splitTextToSize(node.textContent.trim(), effectiveWidth)
            for (const line of lines) {
              pdf.text(line, margin, y)
              y += 8
            }
            y += 4
            pdf.setFontSize(12)
            pdf.setTextColor(0, 0, 0) // Reset to black
          } else if (node.tagName === "P") {
            if (y > pageHeight - margin - 5) {
              addNewPage()
            }
            const lines = pdf.splitTextToSize(node.textContent.trim(), effectiveWidth)
            for (const line of lines) {
              if (y > pageHeight - margin) {
                addNewPage()
              }
              pdf.text(line, margin, y)
              y += lineHeight
            }
            y += 5 // Add space after paragraph
          } else if (node.tagName === "PRE" || node.tagName === "CODE") {
            // For code blocks, use monospace font and add background
            pdf.setFont("courier")
            const codeText = node.textContent.trim()
            const codeLines = codeText.split("\n")

            // Calculate if we need a new page
            const codeBlockHeight = codeLines.length * lineHeight + 10
            if (y + codeBlockHeight > pageHeight - margin) {
              addNewPage()
            }

            // Draw light gray background for code block
            pdf.setFillColor(240, 240, 240)
            pdf.rect(margin - 2, y - 2, effectiveWidth + 4, codeBlockHeight, "F")

            // Add code text
            for (const line of codeLines) {
              if (y > pageHeight - margin) {
                addNewPage()
                // Continue the code block background on the new page
                pdf.setFillColor(240, 240, 240)
                pdf.rect(
                  margin - 2,
                  y - 2,
                  effectiveWidth + 4,
                  Math.min(codeBlockHeight, pageHeight - margin - y + 2),
                  "F",
                )
              }
              pdf.text(line, margin, y)
              y += lineHeight
            }

            y += 5 // Add space after code block
            pdf.setFont("helvetica") // Reset font
          } else if (node.tagName === "UL" || node.tagName === "OL") {
            // Process list items
            for (const child of node.children) {
              if (child.tagName === "LI") {
                if (y > pageHeight - margin - 5) {
                  addNewPage()
                }
                const bulletText = node.tagName === "UL" ? "• " : `${Array.from(node.children).indexOf(child) + 1}. `
                pdf.text(bulletText, margin, y)

                const lines = pdf.splitTextToSize(child.textContent.trim(), effectiveWidth - 10)
                for (let i = 0; i < lines.length; i++) {
                  if (i === 0) {
                    pdf.text(lines[i], margin + 5, y)
                  } else {
                    if (y > pageHeight - margin) {
                      addNewPage()
                    }
                    pdf.text(lines[i], margin + 5, y)
                  }
                  y += lineHeight
                }
                y += 2 // Space after list item
              }
            }
          } else {
            // Process child nodes for other elements
            for (const child of node.childNodes) {
              processNode(child)
            }
          }
        }
      }

      // Process all nodes
      for (const child of tempDiv.childNodes) {
        processNode(child)
      }

      // Add page numbers
      const totalPages = currentPage
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(10)
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 25, pageHeight - 10)
      }

      // Save the PDF
      pdf.save(`${documentation.project_name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}-documentation.pdf`)
    } catch (error) {
      console.error("Error downloading documentation:", error)
      alert(`Failed to download documentation: ${error.message || "Unknown error"}`)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleDownload} disabled={isDownloading} className="flex items-center gap-2">
      <Download className="h-4 w-4" />
      {isDownloading ? "Generating PDF..." : "Download PDF"}
    </Button>
  )
}
