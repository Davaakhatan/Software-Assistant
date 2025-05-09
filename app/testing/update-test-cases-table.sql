-- Add columns for uploaded files if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'test_cases' AND column_name = 'uploaded_file_url') THEN
        ALTER TABLE test_cases ADD COLUMN uploaded_file_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'test_cases' AND column_name = 'uploaded_file_name') THEN
        ALTER TABLE test_cases ADD COLUMN uploaded_file_name TEXT;
    END IF;
END $$;
