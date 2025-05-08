import { ImprovedSpecificationForm } from "../improved-specification-form"

export default function ImprovedSpecificationGenerator() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-start mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Create System Specification</h1>
        <p className="text-muted-foreground">Define the requirements and architecture for your software system</p>
      </div>

      <ImprovedSpecificationForm />
    </div>
  )
}
