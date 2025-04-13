-- Check if the generated_code table exists, if not create it
CREATE TABLE IF NOT EXISTS generated_code (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    language TEXT,
    framework TEXT,
    requirements TEXT,
    extracted_code TEXT NOT NULL,
    specification_id UUID REFERENCES specifications(id) ON DELETE SET NULL,
    design_id UUID REFERENCES designs(id) ON DELETE SET NULL
);
