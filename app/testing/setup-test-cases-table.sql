-- SQL script to create the test_cases table
CREATE TABLE IF NOT EXISTS test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  test_type TEXT,
  framework TEXT,
  component_to_test TEXT,
  generated_tests JSONB,
  specification_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a function to be called via RPC
CREATE OR REPLACE FUNCTION create_test_cases_table()
RETURNS VOID AS $$
BEGIN
  -- Check if the table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'test_cases'
  ) THEN
    -- Create the table
    CREATE TABLE test_cases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT,
      test_type TEXT,
      framework TEXT,
      component_to_test TEXT,
      generated_tests JSONB,
      specification_id UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
  
  -- Check if specification_id column exists
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'test_cases' 
    AND column_name = 'specification_id'
  ) THEN
    -- Add the column
    ALTER TABLE test_cases ADD COLUMN specification_id UUID;
  END IF;
END;
$$ LANGUAGE plpgsql;
