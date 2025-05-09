-- Check if the test_cases table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'test_cases') THEN
        -- Create the test_cases table if it doesn't exist
        CREATE TABLE public.test_cases (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            test_type TEXT NOT NULL,
            framework TEXT NOT NULL,
            component_name TEXT,
            test_cases JSONB,
            generated_tests TEXT,
            specification_id UUID REFERENCES public.specifications(id) ON DELETE CASCADE,
            design_id UUID REFERENCES public.designs(id) ON DELETE SET NULL,
            generated_code_id UUID REFERENCES public.code_generations(id) ON DELETE SET NULL,
            uploaded_file_url TEXT,
            uploaded_file_name TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Add RLS policies
        ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for all operations
        CREATE POLICY "Enable all operations for authenticated users" ON public.test_cases
            USING (true)
            WITH CHECK (true);
    ELSE
        -- Add columns if they don't exist
        BEGIN
            IF NOT EXISTS (SELECT FROM information_schema.columns 
                          WHERE table_schema = 'public' 
                          AND table_name = 'test_cases' 
                          AND column_name = 'uploaded_file_url') THEN
                ALTER TABLE public.test_cases ADD COLUMN uploaded_file_url TEXT;
            END IF;
            
            IF NOT EXISTS (SELECT FROM information_schema.columns 
                          WHERE table_schema = 'public' 
                          AND table_name = 'test_cases' 
                          AND column_name = 'uploaded_file_name') THEN
                ALTER TABLE public.test_cases ADD COLUMN uploaded_file_name TEXT;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Error adding columns: %', SQLERRM;
        END;
    END IF;
END
$$;

-- Create a function to check and create the test_cases table
CREATE OR REPLACE FUNCTION create_test_cases_table()
RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'test_cases') THEN
        -- Create the test_cases table if it doesn't exist
        CREATE TABLE public.test_cases (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            test_type TEXT NOT NULL,
            framework TEXT NOT NULL,
            component_name TEXT,
            test_cases JSONB,
            generated_tests TEXT,
            specification_id UUID REFERENCES public.specifications(id) ON DELETE CASCADE,
            design_id UUID REFERENCES public.designs(id) ON DELETE SET NULL,
            generated_code_id UUID REFERENCES public.code_generations(id) ON DELETE SET NULL,
            uploaded_file_url TEXT,
            uploaded_file_name TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Add RLS policies
        ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for all operations
        CREATE POLICY "Enable all operations for authenticated users" ON public.test_cases
            USING (true)
            WITH CHECK (true);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to setup the test_cases table that can be called via RPC
CREATE OR REPLACE FUNCTION setup_test_cases_table()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Check if the table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'test_cases') THEN
        -- Create the table
        CREATE TABLE public.test_cases (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            test_type TEXT NOT NULL,
            framework TEXT NOT NULL,
            component_name TEXT,
            test_cases JSONB,
            generated_tests TEXT,
            specification_id UUID REFERENCES public.specifications(id) ON DELETE CASCADE,
            design_id UUID REFERENCES public.designs(id) ON DELETE SET NULL,
            generated_code_id UUID REFERENCES public.code_generations(id) ON DELETE SET NULL,
            uploaded_file_url TEXT,
            uploaded_file_name TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Add RLS policies
        ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for all operations
        CREATE POLICY "Enable all operations for authenticated users" ON public.test_cases
            USING (true)
            WITH CHECK (true);
            
        result = '{"success": true, "message": "Test cases table created successfully"}'::JSONB;
    ELSE
        -- Add columns if they don't exist
        BEGIN
            IF NOT EXISTS (SELECT FROM information_schema.columns 
                          WHERE table_schema = 'public' 
                          AND table_name = 'test_cases' 
                          AND column_name = 'uploaded_file_url') THEN
                ALTER TABLE public.test_cases ADD COLUMN uploaded_file_url TEXT;
            END IF;
            
            IF NOT EXISTS (SELECT FROM information_schema.columns 
                          WHERE table_schema = 'public' 
                          AND table_name = 'test_cases' 
                          AND column_name = 'uploaded_file_name') THEN
                ALTER TABLE public.test_cases ADD COLUMN uploaded_file_name TEXT;
            END IF;
            
            result = '{"success": true, "message": "Test cases table already exists, columns updated if needed"}'::JSONB;
        EXCEPTION
            WHEN OTHERS THEN
                result = jsonb_build_object('success', false, 'error', SQLERRM);
        END;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Execute the setup function
SELECT setup_test_cases_table();
