import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const bucket = formData.get("bucket") as string
    const path = formData.get("path") as string

    if (!file || !bucket) {
      return NextResponse.json({ success: false, error: "File and bucket are required" }, { status: 400 })
    }

    // Check file size
    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      return NextResponse.json({ success: false, error: "File size exceeds 5MB limit" }, { status: 400 })
    }

    // Use admin client to bypass RLS
    const supabase = getSupabaseAdmin()

    // Create the bucket if it doesn't exist
    try {
      const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(bucket)

      if (bucketError && bucketError.message.includes("not found")) {
        const { error: createBucketError } = await supabase.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024, // 5MB
        })

        if (createBucketError) {
          console.error("Error creating bucket:", createBucketError)
          return NextResponse.json(
            { success: false, error: `Error creating bucket: ${createBucketError.message}` },
            { status: 500 },
          )
        }
      }
    } catch (bucketError) {
      console.error("Error checking bucket:", bucketError)
      // Continue anyway, we'll try to upload the file
    }

    // Upload file to Supabase Storage
    const filePath = `${path}/${file.name}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { data, error } = await supabase.storage.from(bucket).upload(filePath, buffer, {
      cacheControl: "3600",
      upsert: true,
    })

    if (error) {
      console.error("Error uploading file:", error)
      return NextResponse.json({ success: false, error: `Error uploading file: ${error.message}` }, { status: 500 })
    }

    // Get the public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    })
  } catch (error) {
    console.error("Error in file upload API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}
