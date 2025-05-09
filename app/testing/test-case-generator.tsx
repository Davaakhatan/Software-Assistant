"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, Download, FileCode, Plus, RefreshCw, Save, Sparkles, TestTube, Trash, Wand2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getSpecifications, getSpecificationById } from "../specification-generator/actions"
import { getDesigns } from "../design/actions"
import { getSupabase } from "@/lib/supabase"
import { generateAITestCases, saveTestCases, getGeneratedCodeById, analyzeUploadedCode } from "./actions"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { getGeneratedCode } from "../code-generation/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { checkAndCreateBucket } from "./storage-actions"
import { ServerFileUpload } from "@/components/server-file-upload"

// Bucket name for file uploads
const STORAGE_BUCKET = "sdlc-files"

export default function TestCaseGenerator() {
  const { toast } = useToast()
  const [testType, setTestType] = useState("unit")
  const [framework, setFramework] = useState("jest")
  const [componentToTest, setComponentToTest] = useState("")
  const [componentDescription, setComponentDescription] = useState("")
  const [testCases, setTestCases] = useState([
    { description: "should render correctly", expectation: "component renders without errors" },
  ])
  const [generatedTests, setGeneratedTests] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("define")
  const [testName, setTestName] = useState("")
  const [useAI, setUseAI] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [bucketReady, setBucketReady] = useState(false)
  const [isBucketLoading, setIsBucketLoading] = useState(true)

  // Added for integration with specifications and designs
  const [specificationsList, setSpecificationsList] = useState([])
  const [selectedSpecificationId, setSelectedSpecificationId] = useState("")
  const [isLoadingSpecifications, setIsLoadingSpecifications] = useState(true)
  const [designsList, setDesignsList] = useState([])
  const [selectedDesignId, setSelectedDesignId] = useState("")
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false)
  const [specificationData, setSpecificationData] = useState(null)
  const [designData, setDesignData] = useState(null)

  // Added for integration with generated code
  const [generatedCodeList, setGeneratedCodeList] = useState([])
  const [selectedCodeId, setSelectedCodeId] = useState("")
  const [isLoadingCode, setIsLoadingCode] = useState(false)
  const [generatedCodeData, setGeneratedCodeData] = useState(null)

  // New state for file upload
  const [uploadedFileUrl, setUploadedFileUrl] = useState("")
  const [uploadedFileName, setUploadedFileName] = useState("")
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false)
  const [fileLanguage, setFileLanguage] = useState("")
  const [fileFramework, setFileFramework] = useState("")
  const [uploadedCodeContent, setUploadedCodeContent] = useState("")
  const [showUploadSection, setShowUploadSection] = useState(false)

  // Check if the bucket exists and create it if it doesn't using server action
  useEffect(() => {
    async function setupBucket() {
      setIsBucketLoading(true)
      try {
        // Call the server action to check and create the bucket
        const result = await checkAndCreateBucket(STORAGE_BUCKET)

        if (result.success) {
          console.log(`Bucket ${STORAGE_BUCKET} is ready`)
          setBucketReady(true)
        } else {
          console.error("Error setting up bucket:", result.error)
          toast({
            title: "Error setting up storage",
            description: result.error || "Could not set up storage bucket. File uploads may not work.",
            variant: "destructive",
          })
          setBucketReady(false)
        }
      } catch (error) {
        console.error("Error in setupBucket:", error)
        toast({
          title: "Error setting up storage",
          description: "An unexpected error occurred while setting up file storage.",
          variant: "destructive",
        })
        setBucketReady(false)
      } finally {
        setIsBucketLoading(false)
      }
    }

    setupBucket()
  }, [toast])

  // Fetch specifications list on component mount
  useEffect(() => {
    fetchSpecifications()
  }, [])

  const fetchSpecifications = async () => {
    setIsLoadingSpecifications(true)
    try {
      console.log("Fetching specifications...")
      const result = await getSpecifications()
      if (result.success) {
        console.log(`Fetched ${result.data?.length || 0} specifications`)
        setSpecificationsList(result.data || [])
      } else {
        console.error("Failed to load specifications:", result.error)
        toast({
          title: "Error loading specifications",
          description: result.error || "Failed to load specifications",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching specifications:", error)
      toast({
        title: "Error",
        description: "Failed to fetch specifications. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingSpecifications(false)
    }
  }

  // Fetch specification details when a specification is selected
  useEffect(() => {
    const fetchSpecificationDetails = async () => {
      if (!selectedSpecificationId) {
        setSpecificationData(null)
        return
      }

      try {
        console.log(`Fetching details for specification: ${selectedSpecificationId}`)
        const result = await getSpecificationById(selectedSpecificationId)
        if (result.success) {
          console.log("Specification details fetched successfully")
          setSpecificationData(result.data)

          // Set default test name based on specification
          const appName = result.data.app_name || "MyApp"
          setTestName(`${appName} - ${testType} tests`)

          // Set component to test based on app type
          let componentName = ""
          if (result.data.app_type === "ecommerce") {
            componentName = "ProductComponent"
          } else if (result.data.app_type === "crm") {
            componentName = "ContactManagementComponent"
          } else {
            componentName = "DashboardComponent"
          }
          setComponentToTest(componentName)

          // Set component description based on specification
          setComponentDescription(
            `A ${result.data.app_type} component for ${appName} that handles ${result.data.app_type === "ecommerce" ? "product display and shopping cart" : result.data.app_type === "crm" ? "contact management and customer data" : "dashboard data visualization"}.`,
          )
        } else {
          console.error("Failed to load specification details:", result.error)
          toast({
            title: "Error",
            description: "Failed to load specification details",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching specification details:", error)
        toast({
          title: "Error",
          description: "Failed to fetch specification details",
          variant: "destructive",
        })
      }
    }

    fetchSpecificationDetails()
  }, [selectedSpecificationId, testType, toast])

  // Fetch designs when a specification is selected
  useEffect(() => {
    fetchDesigns()
  }, [selectedSpecificationId])

  const fetchDesigns = async () => {
    if (!selectedSpecificationId) {
      setDesignsList([])
      return
    }

    setIsLoadingDesigns(true)
    try {
      console.log(`Fetching designs for specification: ${selectedSpecificationId}`)

      // First, find requirements linked to this specification
      const supabase = getSupabase()
      const { data: requirements, error: requirementError } = await supabase
        .from("requirements")
        .select("id")
        .eq("specification_id", selectedSpecificationId)

      if (requirementError) {
        console.error("Error fetching requirements:", requirementError)
        toast({
          title: "Error",
          description: "Failed to fetch requirements",
          variant: "destructive",
        })
        setDesignsList([])
        setIsLoadingDesigns(false)
        return
      }

      if (!requirements || requirements.length === 0) {
        console.log("No requirements found for this specification")
        setDesignsList([])
        setIsLoadingDesigns(false)
        return
      }

      const requirementIds = requirements.map((req) => req.id)
      console.log(`Found ${requirementIds.length} requirements for this specification`)

      // Now get designs for these requirements
      const result = await getDesigns()
      if (result.success) {
        // Filter designs to only include those for these requirements
        const filteredDesigns = result.data.filter(
          (design) => design.requirement_id && requirementIds.includes(design.requirement_id),
        )
        console.log(`Found ${filteredDesigns.length} designs for these requirements`)
        setDesignsList(filteredDesigns || [])
      } else {
        console.error("Failed to load designs:", result.error)
        toast({
          title: "Error",
          description: "Failed to load designs",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching designs:", error)
      toast({
        title: "Error",
        description: "Failed to fetch designs",
        variant: "destructive",
      })
    } finally {
      setIsLoadingDesigns(false)
    }
  }

  // Fetch design details when a design is selected
  useEffect(() => {
    const fetchDesignDetails = async () => {
      if (!selectedDesignId) {
        setDesignData(null)
        return
      }

      try {
        console.log(`Fetching details for design: ${selectedDesignId}`)
        const supabase = getSupabase()
        const { data, error } = await supabase.from("designs").select("*").eq("id", selectedDesignId).single()

        if (error) {
          console.error("Error fetching design details:", error)
          toast({
            title: "Error",
            description: "Failed to fetch design details",
            variant: "destructive",
          })
          return
        }

        console.log("Design details fetched successfully")
        setDesignData(data)
      } catch (error) {
        console.error("Error fetching design details:", error)
        toast({
          title: "Error",
          description: "Failed to fetch design details",
          variant: "destructive",
        })
      }
    }

    fetchDesignDetails()
  }, [selectedDesignId, toast])

  // Fetch generated code list
  useEffect(() => {
    fetchGeneratedCode()
  }, [selectedSpecificationId])

  const fetchGeneratedCode = async () => {
    if (!selectedSpecificationId) {
      setGeneratedCodeList([])
      return
    }

    setIsLoadingCode(true)
    try {
      console.log("Fetching generated code...")
      const result = await getGeneratedCode()
      if (result.success) {
        // Filter code to only include those for this specification
        const filteredCode = result.data.filter((code) => code.specification_id === selectedSpecificationId)
        console.log(`Found ${filteredCode.length} code generations for this specification`)
        setGeneratedCodeList(filteredCode || [])
      } else {
        console.error("Failed to load generated code:", result.error)
      }
    } catch (error) {
      console.error("Error fetching generated code:", error)
    } finally {
      setIsLoadingCode(false)
    }
  }

  // Fetch generated code details when a code is selected
  useEffect(() => {
    const fetchGeneratedCodeDetails = async () => {
      if (!selectedCodeId) {
        setGeneratedCodeData(null)
        return
      }

      try {
        console.log(`Fetching details for generated code: ${selectedCodeId}`)
        const result = await getGeneratedCodeById(selectedCodeId)
        if (result.success) {
          console.log("Generated code details fetched successfully")
          setGeneratedCodeData(result.data)

          // Update component to test based on the generated code
          if (result.data.language === "typescript" || result.data.language === "javascript") {
            // Try to extract component name from the code
            const code = result.data.generated_code || ""
            const componentMatch = code.match(/function\s+([A-Za-z0-9_]+)\s*\(/)
            const classMatch = code.match(/class\s+([A-Za-z0-9_]+)\s+/)
            const exportMatch = code.match(/export\s+default\s+function\s+([A-Za-z0-9_]+)\s*\(/)

            const componentName = exportMatch?.[1] || componentMatch?.[1] || classMatch?.[1] || "Component"
            setComponentToTest(componentName)

            // Set component description based on the code
            setComponentDescription(
              `Generated ${result.data.language} component using ${result.data.framework} framework.`,
            )
          }
        } else {
          console.error("Failed to load generated code details:", result.error)
        }
      } catch (error) {
        console.error("Error fetching generated code details:", error)
      }
    }

    fetchGeneratedCodeDetails()
  }, [selectedCodeId])

  const addTestCase = () => {
    setTestCases([...testCases, { description: "", expectation: "" }])
  }

  const updateTestCase = (index, field, value) => {
    const updatedTestCases = [...testCases]
    updatedTestCases[index][field] = value
    setTestCases(updatedTestCases)
  }

  const removeTestCase = (index) => {
    const updatedTestCases = [...testCases]
    updatedTestCases.splice(index, 1)
    setTestCases(updatedTestCases)
  }

  // Function to refresh all data
  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      await fetchSpecifications()
      if (selectedSpecificationId) {
        await fetchDesigns()
        await fetchGeneratedCode()
      }
      toast({
        title: "Data refreshed",
        description: "All data has been refreshed successfully.",
      })
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast({
        title: "Error",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Handle file upload completion
  const handleUploadComplete = async (url) => {
    setUploadedFileUrl(url)

    // Extract filename from URL
    const filename = url.split("/").pop()
    setUploadedFileName(filename)

    // Determine language from file extension
    const extension = filename.split(".").pop().toLowerCase()
    let language = "javascript"
    let framework = "react"

    if (extension === "ts" || extension === "tsx") {
      language = "typescript"
    } else if (extension === "jsx") {
      language = "javascript"
    } else if (extension === "vue") {
      language = "javascript"
      framework = "vue"
    } else if (extension === "svelte") {
      language = "javascript"
      framework = "svelte"
    }

    setFileLanguage(language)
    setFileFramework(framework)

    // Set test framework based on language
    if (language === "typescript") {
      setFramework("jest")
    }

    toast({
      title: "File uploaded",
      description: `${filename} has been uploaded successfully.`,
    })

    // Analyze the uploaded code
    await handleCodeAnalysis(url, filename)
  }

  // Analyze the uploaded code
  const handleCodeAnalysis = async (url, filename) => {
    setIsAnalyzingFile(true)
    try {
      // Call the server action to analyze the code
      const result = await analyzeUploadedCode({
        fileUrl: url,
        fileName: filename,
      })

      if (result.success) {
        // Update state with the analyzed code information
        setComponentToTest(result.componentName || filename.split(".")[0])
        setComponentDescription(result.description || `Component from uploaded file ${filename}`)
        setUploadedCodeContent(result.codeContent || "")

        if (result.suggestedTestCases && result.suggestedTestCases.length > 0) {
          setTestCases(result.suggestedTestCases)
        }

        toast({
          title: "Code analyzed",
          description: "Your code has been analyzed and test cases have been suggested.",
        })

        // Set test name based on the component name
        setTestName(`${result.componentName || filename.split(".")[0]} Tests`)
      } else {
        console.error("Error analyzing code:", result.error)
        toast({
          title: "Error analyzing code",
          description: result.error || "Failed to analyze the uploaded code.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error in analyzeUploadedCode:", error)
      toast({
        title: "Error",
        description: "Failed to analyze the uploaded code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzingFile(false)
    }
  }

  // Generate test cases with AI
  const generateWithAI = async () => {
    if (!componentToTest.trim() && !uploadedFileUrl) {
      toast({
        title: "Component name required",
        description: "Please provide a component name or upload a file to generate tests.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setActiveTab("generated")

    try {
      // Call the server action to generate test cases with AI
      const result = await generateAITestCases({
        testType,
        framework,
        componentToTest,
        componentDescription,
        specificationData,
        designData,
        generatedCodeData,
        uploadedFileUrl,
        uploadedFileName,
        uploadedCodeContent,
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to generate tests with AI")
      }

      // Update the UI with the generated test cases and code
      if (Array.isArray(result.testCases) && result.testCases.length > 0) {
        setTestCases(result.testCases)
      } else {
        // Fallback if no test cases were returned
        setTestCases([
          { description: "should render correctly", expectation: "component renders without errors" },
          { description: "should handle user interactions", expectation: "component responds to user actions" },
        ])
      }

      setGeneratedTests(result.testCode || "")

      toast({
        title: "AI tests generated",
        description: "Test cases have been generated using AI.",
      })
    } catch (error) {
      console.error("Error generating tests with AI:", error)

      // Even if there's an error, try to show something useful
      setTestCases([
        { description: "should render correctly", expectation: "component renders without errors" },
        { description: "should handle user interactions", expectation: "component responds to user actions" },
      ])

      setGeneratedTests(
        `// Error generating tests: ${error.message}\n\n// Here's a basic test structure you can customize:\n\nimport { render, screen } from '@testing-library/react';\nimport ${componentToTest} from './${componentToTest}';\n\ndescribe('${componentToTest}', () => {\n  test('should render correctly', () => {\n    render(<${componentToTest} />);\n    // Add your assertions here\n  });\n});`,
      )

      toast({
        title: "Error",
        description: "There was an issue generating tests with AI. Basic test structure provided instead.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Function to generate test cases from specification and design
  const generateFromSpecification = async () => {
    if (!selectedSpecificationId) {
      toast({
        title: "No specification selected",
        description: "Please select a specification to generate tests from.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setActiveTab("generated")

    try {
      if (useAI) {
        // Use AI to generate tests based on specification
        await generateWithAI()
        return
      }

      // Get specification details
      const specResult = await getSpecificationById(selectedSpecificationId)
      if (!specResult.success) {
        throw new Error(specResult.error || "Failed to get specification details")
      }

      const specData = specResult.data

      // Extract component name from specification
      const appName = specData.app_name || "MyApp"
      const appType = specData.app_type || "web"

      // Set default test name based on specification
      setTestName(`${appName} - ${testType} tests`)

      // Set component to test based on app type
      let componentName = ""
      if (appType === "ecommerce") {
        componentName = "ProductComponent"
      } else if (appType === "crm") {
        componentName = "ContactManagementComponent"
      } else {
        componentName = "DashboardComponent"
      }

      setComponentToTest(componentName)

      // Generate test cases based on app type
      const newTestCases = []

      // Common test cases
      newTestCases.push({
        description: "should render correctly",
        expectation: "component renders without errors",
      })

      newTestCases.push({
        description: "should show loading state initially",
        expectation: "loading indicator is displayed while data is being fetched",
      })

      // App-specific test cases
      if (appType === "ecommerce") {
        newTestCases.push({
          description: "should display product list when data is loaded",
          expectation: "product items are rendered in the list",
        })

        newTestCases.push({
          description: "should handle add to cart action",
          expectation: "product is added to cart when button is clicked",
        })

        newTestCases.push({
          description: "should display error message when API fails",
          expectation: "error message is shown to the user",
        })
      } else if (appType === "crm") {
        newTestCases.push({
          description: "should display contact list when data is loaded",
          expectation: "contact items are rendered in the table",
        })

        newTestCases.push({
          description: "should filter contacts when search is used",
          expectation: "only matching contacts are displayed",
        })

        newTestCases.push({
          description: "should handle contact deletion",
          expectation: "contact is removed from the list when delete is confirmed",
        })
      } else {
        newTestCases.push({
          description: "should display dashboard widgets when data is loaded",
          expectation: "dashboard widgets are rendered correctly",
        })

        newTestCases.push({
          description: "should update data when refresh is clicked",
          expectation: "fresh data is fetched and displayed",
        })

        newTestCases.push({
          description: "should navigate to detail view when item is clicked",
          expectation: "navigation to detail page occurs with correct ID",
        })
      }

      setTestCases(newTestCases)

      // Generate test code
      const testCode = generateTestCode(testType, framework, componentName, newTestCases, appType)
      setGeneratedTests(testCode)

      toast({
        title: "Tests generated",
        description: "Test cases have been generated based on the specification.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate tests",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Helper function to generate test code
  const generateTestCode = (testType, framework, componentName, testCases, appType) => {
    if (framework === "jest") {
      return `// Generated ${testType} tests for ${componentName} using Jest and React Testing Library

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ${componentName} from './${componentName}';
${testType === "integration" ? "import { QueryClient, QueryClientProvider } from 'react-query';" : ""}
${testType === "integration" ? "\nconst queryClient = new QueryClient();\n" : ""}

${
  testType === "integration"
    ? `const renderWithProviders = (ui) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};`
    : ""
}

describe('${componentName}', () => {
  ${
    testType === "unit"
      ? `beforeEach(() => {
    // Mock fetch or axios
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });`
      : ""
  }

  ${testCases
    .map((tc) => {
      if (tc.description === "should render correctly") {
        return `test('${tc.description}', () => {
    // Arrange
    ${testType === "integration" ? "renderWithProviders(<" + componentName + " />);" : "render(<" + componentName + " />);"}
    
    // Assert
    expect(screen.getByText(/${appType === "ecommerce" ? "Products" : appType === "crm" ? "Contacts" : "Dashboard"}/i)).toBeInTheDocument();
  });`
      } else if (tc.description === "should show loading state initially") {
        return `test('${tc.description}', () => {
    // Arrange
    ${
      testType === "unit"
        ? `global.fetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );`
        : ""
    }
    
    // Act
    ${testType === "integration" ? "renderWithProviders(<" + componentName + " />);" : "render(<" + componentName + " />);"}
    
    // Assert
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });`
      } else if (tc.description.includes("when data is loaded")) {
        return `test('${tc.description}', async () => {
    // Arrange
    ${
      testType === "unit"
        ? `const mockData = [
      ${
        appType === "ecommerce"
          ? `{ id: '1', name: 'Test Product', price: 99.99, description: 'A test product' },
      { id: '2', name: 'Another Product', price: 149.99, description: 'Another test product' }`
          : appType === "crm"
            ? `{ id: '1', name: 'John Doe', email: 'john@example.com', company: 'Acme Inc', status: 'active' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', company: 'XYZ Corp', status: 'inactive' }`
            : `{ id: '1', title: 'Sales Overview', value: 12345, trend: 'up' },
      { id: '2', title: 'New Users', value: 42, trend: 'down' }`
      }
    ];
    
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData)
      })
    );`
        : ""
    }
    
    // Act
    ${testType === "integration" ? "renderWithProviders(<" + componentName + " />);" : "render(<" + componentName + " />);"}
    
    // Assert
    ${
      testType === "unit"
        ? `await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    ${
      appType === "ecommerce"
        ? "expect(screen.getByText('Test Product')).toBeInTheDocument();\n    expect(screen.getByText('$99.99')).toBeInTheDocument();"
        : appType === "crm"
          ? "expect(screen.getByText('John Doe')).toBeInTheDocument();\n    expect(screen.getByText('john@example.com')).toBeInTheDocument();"
          : "expect(screen.getByText('Sales Overview')).toBeInTheDocument();\n    expect(screen.getByText('12345')).toBeInTheDocument();"
    }`
        : `await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    // In integration tests, we'd check for elements that should appear when data is loaded
    ${
      appType === "ecommerce"
        ? "expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();"
        : appType === "crm"
          ? "expect(screen.getByRole('table')).toBeInTheDocument();"
          : "expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();"
    }`
    }
  });`
      } else if (tc.description.includes("error message")) {
        return `test('${tc.description}', async () => {
    // Arrange
    ${
      testType === "unit"
        ? `global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' })
      })
    );`
        : ""
    }
    
    // Act
    ${testType === "integration" ? "renderWithProviders(<" + componentName + " />);" : "render(<" + componentName + " />);"}
    
    // Assert
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });`
      } else {
        return `test('${tc.description}', async () => {
    // Arrange
    ${
      testType === "unit"
        ? `const mockData = [
      ${
        appType === "ecommerce"
          ? `{ id: '1', name: 'Test Product', price: 99.99, description: 'A test product' }`
          : appType === "crm"
            ? `{ id: '1', name: 'John Doe', email: 'john@example.com', company: 'Acme Inc', status: 'active' }`
            : `{ id: '1', title: 'Sales Overview', value: 12345, trend: 'up' }`
      }
    ];
    
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData)
      })
    );`
        : ""
    }
    
    // Act
    ${testType === "integration" ? "renderWithProviders(<" + componentName + " />);" : "render(<" + componentName + " />);"}
    
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    ${
      appType === "ecommerce" && tc.description.includes("add to cart")
        ? `// Find and click the Add to Cart button
    const addButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addButton);
    
    // Assert that the product was added to cart
    expect(screen.getByText(/added to cart/i)).toBeInTheDocument();`
        : appType === "crm" && tc.description.includes("filter")
          ? `// Find and use the search input
    const searchInput = screen.getByRole('textbox', { name: /search/i });
    userEvent.type(searchInput, 'John');
    
    // Assert that filtering works
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();`
          : `// Perform the specific action for this test case
    // This would be customized based on the actual component behavior
    
    // Assert the expected outcome
    expect(${tc.expectation.includes("navigation") ? "mockNavigate" : "screen"}).${tc.expectation.includes("navigation") ? "toHaveBeenCalledWith" : "toBeInTheDocument"}();`
    }
  });`
      }
    })
    .join("\n\n  ")}
});`
    } else if (framework === "vitest") {
      // Similar structure for Vitest
      return `// Generated ${testType} tests for ${componentName} using Vitest and React Testing Library

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ${componentName} from './${componentName}';

describe('${componentName}', () => {
  // Similar test implementation as Jest but with Vitest syntax
  // ...
});`
    } else {
      // Default for other frameworks
      return `// Generated ${testType} tests for ${componentName} using ${framework}

// This is a placeholder for ${framework} test code
// The structure would be similar to the Jest example but with ${framework}-specific syntax
`
    }
  }

  const handleGenerate = async () => {
    if (useAI) {
      // Generate with AI
      await generateWithAI()
    } else if (selectedSpecificationId) {
      // Generate from specification
      await generateFromSpecification()
    } else {
      setIsGenerating(true)
      setActiveTab("generated")

      // Simulate test generation delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // In a real app, this would call an AI service to generate tests
      const sampleTests = `// Generated ${testType} tests for ${componentToTest} using ${framework}

import { render, screen, fireEvent } from '@testing-library/react';
import ${componentToTest.split("/").pop()} from '${componentToTest}';

describe('${componentToTest.split("/").pop()}', () => {
  ${testCases
    .map(
      (tc) => `
  test('${tc.description}', () => {
    // Arrange
    render(<${componentToTest.split("/").pop()} />);
    
    // Act
    // ... perform actions based on the test case
    
    // Assert
    // ... verify ${tc.expectation}
  });`,
    )
    .join("\n")}
});`

      setGeneratedTests(sampleTests)
      setTestName(`${componentToTest.split("/").pop()} Tests`)
      setIsGenerating(false)

      toast({
        title: "Tests generated",
        description: "Your test cases have been generated successfully.",
      })
    }
  }

  const handleSaveTests = async () => {
    if (!selectedSpecificationId) {
      toast({
        title: "Error",
        description: "Please select a specification to save the tests.",
        variant: "destructive",
      })
      return
    }

    if (!generatedTests.trim()) {
      toast({
        title: "Error",
        description: "No tests to save. Please generate tests first.",
        variant: "destructive",
      })
      return
    }

    if (!testName.trim()) {
      toast({
        title: "Error",
        description: "Please provide a name for the tests.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      // Use a minimal set of fields for saving
      const result = await saveTestCases({
        testType,
        framework,
        componentToTest,
        testCases,
        generatedTests,
        specificationId: selectedSpecificationId,
        designId: selectedDesignId || null,
        generatedCodeId: selectedCodeId || null,
        name: testName,
        uploadedFileUrl: uploadedFileUrl || null,
        uploadedFileName: uploadedFileName || null,
      })

      if (result.success) {
        toast({
          title: "Tests saved",
          description: "Your test cases have been saved successfully.",
        })

        // Store the generated code and test name in localStorage as a backup
        try {
          localStorage.setItem(`test-code-${result.data.id}`, generatedTests)
          localStorage.setItem(`test-name-${result.data.id}`, testName)
        } catch (storageError) {
          console.warn("Could not save to localStorage:", storageError)
        }
      } else {
        // If saving to the database fails, store in localStorage as a fallback
        try {
          const fallbackId = `local-${Date.now()}`
          localStorage.setItem(`test-code-${fallbackId}`, generatedTests)
          localStorage.setItem(`test-name-${fallbackId}`, testName)
          localStorage.setItem(
            `test-data-${fallbackId}`,
            JSON.stringify({
              testType,
              framework,
              componentToTest,
              testCases,
              specificationId: selectedSpecificationId,
            }),
          )

          toast({
            title: "Tests saved locally",
            description: "Could not save to database, but tests were saved to your browser storage.",
          })
        } catch (localStorageError) {
          throw new Error(`Database error: ${result.error}. Local storage error: ${localStorageError.message}`)
        }
      }
    } catch (error) {
      console.error("Error saving tests:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save tests.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = () => {
    // In a real app, this would download the generated tests
    const blob = new Blob([generatedTests], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${testName || "generated-tests"}.${framework === "jest" ? "test.js" : framework === "vitest" ? "spec.js" : "js"}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Tests downloaded",
      description: "Your generated tests have been downloaded.",
    })
  }

  const handleRunTests = () => {
    // In a real app, this would run the tests
    toast({
      title: "Tests running",
      description: "Your tests are now running. Check the console for results.",
    })

    // Simulate test results
    setTimeout(() => {
      toast({
        title: "Tests passed",
        description: `All ${testCases.length} tests passed successfully.`,
      })
    }, 3000)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={refreshData} disabled={isRefreshing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="define">Define Tests</TabsTrigger>
          <TabsTrigger value="generated">Generated Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="define" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
              <CardDescription>Define what you want to test</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch id="use-ai" checked={useAI} onCheckedChange={setUseAI} />
                <Label htmlFor="use-ai" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  Use AI to generate tests
                </Label>
              </div>

              {/* New Upload Code Section */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Upload Code to Test</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUploadSection(!showUploadSection)}
                    className="gap-2"
                  >
                    {showUploadSection ? "Hide" : "Show"} Upload Section
                    <FileCode className="h-4 w-4" />
                  </Button>
                </div>

                {showUploadSection && (
                  <div className="space-y-4 p-4 border rounded-md">
                    <div className="space-y-2">
                      <Label>Upload your code file</Label>
                      <div className="flex flex-col gap-4">
                        {isBucketLoading ? (
                          <div className="flex items-center justify-center p-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                            <span>Preparing storage...</span>
                          </div>
                        ) : bucketReady ? (
                          <ServerFileUpload
                            bucket={STORAGE_BUCKET}
                            path="code-uploads"
                            onUploadComplete={handleUploadComplete}
                          />
                        ) : (
                          <Alert variant="destructive">
                            <AlertTitle>Storage not available</AlertTitle>
                            <AlertDescription>
                              Could not set up storage for file uploads. Please try again later or contact an
                              administrator.
                            </AlertDescription>
                          </Alert>
                        )}

                        {isAnalyzingFile && (
                          <div className="flex items-center justify-center p-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                            <span>Analyzing file...</span>
                          </div>
                        )}

                        {uploadedFileUrl && (
                          <Alert className="mt-4">
                            <FileCode className="h-4 w-4" />
                            <AlertTitle>File uploaded successfully</AlertTitle>
                            <AlertDescription>{uploadedFileName} has been uploaded and analyzed.</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Label>Generate from Specification</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="specification">Select Specification</Label>
                    <Select
                      value={selectedSpecificationId}
                      onValueChange={setSelectedSpecificationId}
                      disabled={isLoadingSpecifications}
                    >
                      <SelectTrigger id="specification">
                        <SelectValue placeholder="Select a specification" />
                      </SelectTrigger>
                      <SelectContent>
                        {specificationsList.length === 0 ? (
                          <SelectItem value="no_specifications">No specifications available</SelectItem>
                        ) : (
                          specificationsList.map((spec) => (
                            <SelectItem key={spec.id} value={spec.id}>
                              {spec.app_name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {isLoadingSpecifications && (
                      <p className="text-sm text-muted-foreground">Loading specifications...</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="design">Select Design (Optional)</Label>
                    <Select
                      value={selectedDesignId}
                      onValueChange={setSelectedDesignId}
                      disabled={isLoadingDesigns || !selectedSpecificationId || designsList.length === 0}
                    >
                      <SelectTrigger id="design">
                        <SelectValue
                          placeholder={designsList.length === 0 ? "No designs available" : "Select a design"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_design">None</SelectItem>
                        {designsList.map((design) => (
                          <SelectItem key={design.id} value={design.id}>
                            {design.type.charAt(0).toUpperCase() + design.type.slice(1)} Design
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isLoadingDesigns && <p className="text-sm text-muted-foreground">Loading designs...</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="generated-code">Select Generated Code (Optional)</Label>
                  <Select
                    value={selectedCodeId}
                    onValueChange={setSelectedCodeId}
                    disabled={isLoadingCode || !selectedSpecificationId || generatedCodeList.length === 0}
                  >
                    <SelectTrigger id="generated-code">
                      <SelectValue
                        placeholder={
                          generatedCodeList.length === 0 ? "No generated code available" : "Select generated code"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_code">None</SelectItem>
                      {generatedCodeList.map((code) => (
                        <SelectItem key={code.id} value={code.id}>
                          {code.language} - {code.framework} ({new Date(code.created_at).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isLoadingCode && <p className="text-sm text-muted-foreground">Loading generated code...</p>}
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={generateFromSpecification}
                    disabled={!selectedSpecificationId || isGenerating}
                    className="gap-2"
                  >
                    {useAI ? <Sparkles className="h-4 w-4 text-yellow-500" /> : <Wand2 className="h-4 w-4" />}
                    Generate from Specification
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="mb-2 block">Or Define Tests Manually</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="test-type">Test Type</Label>
                    <Select value={testType} onValueChange={setTestType}>
                      <SelectTrigger id="test-type">
                        <SelectValue placeholder="Select test type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unit">Unit Tests</SelectItem>
                        <SelectItem value="integration">Integration Tests</SelectItem>
                        <SelectItem value="e2e">End-to-End Tests</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="framework">Testing Framework</Label>
                    <Select value={framework} onValueChange={setFramework}>
                      <SelectTrigger id="framework">
                        <SelectValue placeholder="Select framework" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="jest">Jest</SelectItem>
                        <SelectItem value="vitest">Vitest</SelectItem>
                        <SelectItem value="mocha">Mocha</SelectItem>
                        <SelectItem value="cypress">Cypress</SelectItem>
                        <SelectItem value="playwright">Playwright</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="component">Component/Module to Test</Label>
                  <Input
                    id="component"
                    placeholder="e.g., src/components/Button"
                    value={componentToTest}
                    onChange={(e) => setComponentToTest(e.target.value)}
                  />
                </div>

                {useAI && (
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="component-description">
                      Component Description (helps AI generate better tests)
                    </Label>
                    <Textarea
                      id="component-description"
                      placeholder="Describe what the component does, its props, and expected behavior..."
                      value={componentDescription}
                      onChange={(e) => setComponentDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                {!useAI && (
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <Label>Test Cases</Label>
                      <Button type="button" onClick={addTestCase} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Test Case
                      </Button>
                    </div>

                    {testCases.map((testCase, index) => (
                      <div key={index} className="space-y-4 p-4 border rounded-md relative">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={() => removeTestCase(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>

                        <div className="space-y-2">
                          <Label htmlFor={`test-desc-${index}`}>Test Description</Label>
                          <Input
                            id={`test-desc-${index}`}
                            placeholder="e.g., should render the button correctly"
                            value={testCase.description}
                            onChange={(e) => updateTestCase(index, "description", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`test-expect-${index}`}>Expected Outcome</Label>
                          <Input
                            id={`test-expect-${index}`}
                            placeholder="e.g., button is in the document with correct text"
                            value={testCase.expectation}
                            onChange={(e) => updateTestCase(index, "expectation", e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleGenerate}
                disabled={
                  (!componentToTest.trim() && !selectedSpecificationId && !uploadedFileUrl) ||
                  (!useAI &&
                    testCases.some((tc) => !tc.description.trim()) &&
                    !selectedSpecificationId &&
                    !uploadedFileUrl) ||
                  isGenerating
                }
                className="gap-2"
              >
                {useAI ? <Sparkles className="h-4 w-4 text-yellow-500" /> : <TestTube className="h-4 w-4" />}
                {isGenerating ? "Generating..." : "Generate Tests"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="generated" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Generated Tests</CardTitle>
              <CardDescription>Review, save, and run your generated tests</CardDescription>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Generating tests based on your configuration...</p>
                  </div>
                </div>
              ) : generatedTests ? (
                <>
                  <div className="mb-4">
                    <Label htmlFor="test-name">Test Name</Label>
                    <Input
                      id="test-name"
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      placeholder="Enter a name for these tests"
                      className="mb-4"
                    />
                  </div>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[500px] text-sm font-mono">
                      {generatedTests}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="text-center p-12 text-muted-foreground">
                  <TestTube className="h-12 w-12 mx-auto mb-4" />
                  <p>No tests generated yet. Configure your test cases and click "Generate Tests".</p>
                </div>
              )}
            </CardContent>
            {generatedTests && (
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("define")} className="gap-2">
                  Edit Test Cases
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleDownload} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSaveTests}
                    disabled={isSaving || !selectedSpecificationId || !testName.trim()}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Tests"}
                  </Button>
                  <Button onClick={handleRunTests} className="gap-2">
                    <Check className="h-4 w-4" />
                    Run Tests
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
