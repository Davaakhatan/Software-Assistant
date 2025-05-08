-- Check if the test_cases table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'test_cases'
    ) THEN
        -- Create the test_cases table
        CREATE TABLE public.test_cases (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT,
            test_type TEXT,
            framework TEXT,
            component_to_test TEXT,
            generated_tests JSONB,
            specification_id UUID,
            design_id UUID,
            generated_code_id UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Add comment to the table
        COMMENT ON TABLE public.test_cases IS 'Stores test cases generated for components';
    END IF;
END
$$;
