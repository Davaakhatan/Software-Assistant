import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST() {
  try {
    // Create code_generations table if it doesn't exist
    const { error: createTableError } = await supabaseServer.rpc("create_code_generations_table")

    if (createTableError) {
      console.error("Error creating code_generations table:", createTableError)

      // Check if the error is because the table already exists
      if (createTableError.message.includes("already exists")) {
        return NextResponse.json({ message: "Database already set up" }, { status: 200 })
      }

      return NextResponse.json({ message: `Error setting up database: ${createTableError.message}` }, { status: 500 })
    }

    return NextResponse.json({ message: "Database setup completed successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error in setup-database route:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
