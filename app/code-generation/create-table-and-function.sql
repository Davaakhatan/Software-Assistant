-- Function to create the code_generations table if it doesn't exist
CREATE OR REPLACE FUNCTION create_code_generations_table()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the table already exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'code_generations'
  ) THEN
    -- Create the table
    CREATE TABLE public.code_generations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      specification_id UUID REFERENCES specifications(id) ON DELETE SET NULL,
      design_id UUID REFERENCES designs(id) ON DELETE SET NULL,
      code TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Add RLS policies
    ALTER TABLE public.code_generations ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Allow authenticated users to select code_generations"
      ON public.code_generations
      FOR SELECT
      USING (auth.role() = 'authenticated');
      
    CREATE POLICY "Allow authenticated users to insert code_generations"
      ON public.code_generations
      FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');
      
    CREATE POLICY "Allow authenticated users to update their own code_generations"
      ON public.code_generations
      FOR UPDATE
      USING (auth.role() = 'authenticated');
      
    CREATE POLICY "Allow authenticated users to delete their own code_generations"
      ON public.code_generations
      FOR DELETE
      USING (auth.role() = 'authenticated');
  END IF;
END;
$$;
