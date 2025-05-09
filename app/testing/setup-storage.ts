"use server"

import { createClient } from "@supabase/supabase-js"

export async function checkAndCreateBucket(bucketName: string) {
  try {
    // Create a server-side Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return {
        success: false,
        error: "Missing Supabase environment variables",
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if the bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error("Error listing buckets:", listError)
      return {
        success: false,
        error: `Error listing buckets: ${listError.message}`,
      }
    }

    const bucketExists = buckets.some((bucket) => bucket.name === bucketName)

    if (!bucketExists) {
      console.log(`Bucket ${bucketName} does not exist, creating it...`)

      // Create the bucket
      const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      })

      if (createError) {
        console.error("Error creating bucket:", createError)
        return {
          success: false,
          error: `Error creating bucket: ${createError.message}`,
        }
      }

      console.log(`Bucket ${bucketName} created successfully`)
    } else {
      console.log(`Bucket ${bucketName} already exists`)
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
