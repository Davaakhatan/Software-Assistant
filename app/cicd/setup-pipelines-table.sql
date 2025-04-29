-- Check if the ci_cd_pipelines table exists, if not create it
CREATE TABLE IF NOT EXISTS ci_cd_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES specifications(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  project_name TEXT NOT NULL,
  generated_config TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS ci_cd_pipelines_project_id_idx ON ci_cd_pipelines(project_id);

-- Disable Row Level Security (RLS)
ALTER TABLE ci_cd_pipelines DISABLE ROW LEVEL SECURITY;
