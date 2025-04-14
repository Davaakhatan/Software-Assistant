-- Create a function to get column names for a table
CREATE OR REPLACE FUNCTION get_designs_table_columns()
RETURNS TEXT[] AS $$
DECLARE
    columns TEXT[];
BEGIN
    SELECT ARRAY_AGG(column_name::TEXT)
    INTO columns
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'designs';
    
    RETURN columns;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to create the designs table if it doesn't exist
CREATE OR REPLACE FUNCTION create_designs_table_if_not_exists()
RETURNS VOID AS $$
BEGIN
    -- Check if the designs table exists
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'designs'
    ) THEN
        -- Create the designs table with minimal required columns
        CREATE TABLE designs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            diagram_code TEXT NOT NULL,
            type TEXT,
            requirement_id UUID,
            user_id UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Add a comment to the table
        COMMENT ON TABLE designs IS 'Stores design diagrams and architecture documents';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to create the get_columns function
CREATE OR REPLACE FUNCTION create_get_columns_function()
RETURNS VOID AS $$
BEGIN
    -- Create the function to get column names
    CREATE OR REPLACE FUNCTION get_designs_table_columns()
    RETURNS TEXT[] AS $$
    DECLARE
        columns TEXT[];
    BEGIN
        SELECT ARRAY_AGG(column_name::TEXT)
        INTO columns
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'designs';
        
        RETURN columns;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to create the designs table if it doesn't exist
SELECT create_designs_table_if_not_exists();

-- Show the current schema of the designs table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'designs'
ORDER BY ordinal_position;
