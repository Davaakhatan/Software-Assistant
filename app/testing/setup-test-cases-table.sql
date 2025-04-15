-- Check if the test_cases table exists and add the test_data column if needed
DO $$
DECLARE
    table_exists BOOLEAN;
    test_data_column_exists BOOLEAN;
BEGIN
    -- Check if the test_cases table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'test_cases'
    ) INTO table_exists;

    IF table_exists THEN
        -- Check if test_data column exists
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'test_cases' 
            AND column_name = 'test_data'
        ) INTO test_data_column_exists;

        IF NOT test_data_column_exists THEN
            -- Add the test_data column if it doesn't exist
            EXECUTE 'ALTER TABLE test_cases ADD COLUMN test_data TEXT';
            RAISE NOTICE 'Added test_data column to test_cases table';
        ELSE
            RAISE NOTICE 'test_data column already exists in test_cases table';
        END IF;
    ELSE
        -- Create the test_cases table if it doesn't exist
        CREATE TABLE test_cases (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID,
            test_type TEXT NOT NULL,
            framework TEXT NOT NULL,
            component_to_test TEXT NOT NULL,
            generated_tests TEXT,
            component TEXT,
            name TEXT,
            specification_id UUID REFERENCES specifications(id) ON DELETE SET NULL,
            test_data TEXT,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );
        RAISE NOTICE 'Created test_cases table with test_data column';
    END IF;
END $$;

-- Show the current schema of the test_cases table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'test_cases'
ORDER BY ordinal_position;
