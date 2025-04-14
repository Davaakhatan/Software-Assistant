-- Check if the designs table exists
DO $$
DECLARE
    table_exists BOOLEAN;
    requirement_column_exists BOOLEAN;
BEGIN
    -- Check if the designs table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'designs'
    ) INTO table_exists;

    IF table_exists THEN
        -- Check if requirement_id column exists
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'designs' 
            AND column_name = 'requirement_id'
        ) INTO requirement_column_exists;

        IF NOT requirement_column_exists THEN
            -- Add the requirement_id column if it doesn't exist
            EXECUTE 'ALTER TABLE designs ADD COLUMN requirement_id UUID REFERENCES requirements(id)';
            RAISE NOTICE 'Added requirement_id column to designs table';
        ELSE
            RAISE NOTICE 'requirement_id column already exists in designs table';
        END IF;
    ELSE
        RAISE NOTICE 'designs table does not exist';
    END IF;
END $$;

-- Show the current schema of the designs table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'designs'
ORDER BY ordinal_position;
