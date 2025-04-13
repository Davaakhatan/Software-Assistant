-- SQL to create the generated_code table
CREATE TABLE IF NOT EXISTS generated_code (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  language TEXT NOT NULL,
  framework TEXT NOT NULL,
  requirements TEXT,
  extracted_code TEXT NOT NULL,
  specification_id UUID REFERENCES specifications(id),
  design_id UUID REFERENCES designs(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a function to check if a table exists
CREATE OR REPLACE FUNCTION check_table_exists(table_name TEXT)
RETURNS BOOLEAN AS $
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = $1
  ) INTO table_exists;
  
  RETURN table_exists;
END;
$ LANGUAGE plpgsql;

-- Create a function to create the generated_code table
CREATE OR REPLACE FUNCTION create_generated_code_table()
RETURNS VOID AS $
BEGIN
  CREATE TABLE IF NOT EXISTS generated_code (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    language TEXT NOT NULL,
    framework TEXT NOT NULL,
    requirements TEXT,
    extracted_code TEXT NOT NULL,
    specification_id UUID,
    design_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
END;
$ LANGUAGE plpgsql;
