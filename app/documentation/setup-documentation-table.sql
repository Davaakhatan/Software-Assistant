-- Check if the documentation table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'documentation'
    ) THEN
        -- Create the documentation table
        CREATE TABLE public.documentation (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            documentation_type TEXT NOT NULL,
            documentation_content TEXT NOT NULL,
            specification_id UUID REFERENCES specifications(id) ON DELETE SET NULL,
            design_id UUID REFERENCES designs(id) ON DELETE SET NULL,
            code_id UUID REFERENCES generated_code(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- Add comment
        COMMENT ON TABLE public.documentation IS 'Stores documentation for specifications, designs, and code';
    END IF;
END
$$;
