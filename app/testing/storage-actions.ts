"use server"

import { getSupabaseAdmin } from "@/lib/supabase-admin"

export async function checkAndCreateBucket(bucketName: string) {
  try {
    // Use admin client to bypass RLS
    const supabase = getSupabaseAdmin()

    // Check if the bucket exists
    try {
      const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(bucketName)

      if (bucketError && bucketError.message.includes("not found")) {
        console.log(`Bucket ${bucketName} does not exist, creating it...`)

        // Create the bucket
        const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024, // 5MB
        })

        if (createBucketError) {
          console.error("Error creating bucket:", createBucketError)
          return {
            success: false,
            error: `Error creating bucket: ${createBucketError.message}`,
          }
        }

        console.log(`Bucket ${bucketName} created successfully`)
      } else {
        console.log(`Bucket ${bucketName} already exists`)
      }
    } catch (bucketError) {
      console.error("Error checking bucket:", bucketError)
      return {
        success: false,
        error: `Error checking bucket: ${bucketError instanceof Error ? bucketError.message : String(bucketError)}`,
      }
    }

    return {
      success: true,
      bucketName,
    }
  } catch (error) {
    console.error("Error in checkAndCreateBucket:", error)
    return {
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
