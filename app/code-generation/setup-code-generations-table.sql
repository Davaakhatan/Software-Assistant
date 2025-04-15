-- Check if the code_generations table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'code_generations'
    ) THEN
        -- Create the code_generations table
        CREATE TABLE public.code_generations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            generated_code TEXT NOT NULL,
            language VARCHAR(50) NOT NULL,
            framework VARCHAR(50) NOT NULL,
            requirements TEXT,
            specification_id UUID REFERENCES public.specifications(id) ON DELETE SET NULL,
            design_id UUID REFERENCES public.designs(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Add comment
        COMMENT ON TABLE public.code_generations IS 'Stores generated code from specifications, designs, or custom requirements';
    END IF;
END
$$;
