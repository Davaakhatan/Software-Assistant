-- First, check if the ci_cd_pipelines table exists
DO $$
DECLARE
    table_exists BOOLEAN;
    constraint_exists BOOLEAN;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ci_cd_pipelines'
    ) INTO table_exists;

    IF table_exists THEN
        -- Check if constraint exists
        SELECT EXISTS (
            SELECT FROM information_schema.table_constraints
            WHERE constraint_name = 'ci_cd_pipelines_project_id_fkey'
            AND table_name = 'ci_cd_pipelines'
        ) INTO constraint_exists;

        IF constraint_exists THEN
            -- Drop the foreign key constraint
            EXECUTE 'ALTER TABLE ci_cd_pipelines DROP CONSTRAINT ci_cd_pipelines_project_id_fkey';
            RAISE NOTICE 'Foreign key constraint dropped';
            
            -- Make project_id nullable
            EXECUTE 'ALTER TABLE ci_cd_pipelines ALTER COLUMN project_id DROP NOT NULL';
            RAISE NOTICE 'Made project_id nullable';
        ELSE
            RAISE NOTICE 'Foreign key constraint does not exist';
        END IF;
    ELSE
        -- Create the table without the foreign key constraint
        CREATE TABLE ci_cd_pipelines (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID,
            platform TEXT NOT NULL,
            project_name TEXT NOT NULL,
            generated_config TEXT NOT NULL,
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created ci_cd_pipelines table without foreign key constraint';
    END IF;
END $$;

-- Add metadata column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'ci_cd_pipelines' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE ci_cd_pipelines ADD COLUMN metadata JSONB;
        RAISE NOTICE 'Added metadata column';
    END IF;
END $$;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS ci_cd_pipelines_project_id_idx ON ci_cd_pipelines(project_id);

-- Disable Row Level Security (RLS)
ALTER TABLE ci_cd_pipelines DISABLE ROW LEVEL SECURITY;

SELECT 'CI/CD Pipelines table has been fixed' as message;
