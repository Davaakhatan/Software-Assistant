"use server"

import { getSupabase } from "@/lib/supabase"

export async function diagnoseGeneratedCodeTable() {
  try {
    const supabase = getSupabase()
    const results = {}

    // Try to get table info
    try {
      const { data, error } = await supabase.from("generated_code").select("*").limit(1)

      results.tableInfo = {
        success: !error,
        columns: data && data.length > 0 ? Object.keys(data[0]) : [],
        error: error ? error.message : null,
      }
    } catch (e) {
      results.tableInfo = { success: false, error: e.message }
    }

    // Try to get table definition from PostgreSQL
    try {
      const { data, error } = await supabase.rpc("execute_sql", {
        sql_query: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'generated_code'
          ORDER BY ordinal_position
        `,
      })

      results.schemaInfo = {
        success: !error,
        columns: data || [],
        error: error ? error.message : null,
      }
    } catch (e) {
      results.schemaInfo = { success: false, error: e.message }
    }

    // Try a minimal insert
    try {
      const { data, error } = await supabase
        .from("generated_code")
        .insert([{ name: "Diagnostic Test " + new Date().toISOString() }])
        .select()

      results.insertTest = {
        success: !error,
        data: data,
        error: error ? error.message : null,
      }
    } catch (e) {
      results.insertTest = { success: false, error: e.message }
    }

    return {
      success: true,
      results,
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}
