-- Check if the documentations table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'documentations'
    ) THEN
        -- Create the documentations table with the correct column names
        CREATE TABLE public.documentations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID,
            doc_type TEXT,
            project_name TEXT NOT NULL,
            project_description TEXT,
            sections JSONB,
            generated_docs TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created documentations table';
    ELSE
        RAISE NOTICE 'Documentations table already exists';
    END IF;
END $$;
