-- Check if the requirements table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'requirements') THEN
        CREATE TABLE requirements (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            specification_id UUID REFERENCES specifications(id),
            user_id UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            status TEXT DEFAULT 'pending',
            priority TEXT DEFAULT 'medium'
        );
    END IF;
END
$$;
