-- Create the generated_code table if it doesn't exist
CREATE TABLE IF NOT EXISTS generated_code (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'typescript',
  framework TEXT NOT NULL DEFAULT 'nextjs',
  requirements TEXT,
  specification_id UUID REFERENCES specifications(id) ON DELETE SET NULL,
  design_id UUID REFERENCES designs(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_generated_code_specification_id ON generated_code(specification_id);
CREATE INDEX IF NOT EXISTS idx_generated_code_design_id ON generated_code(design_id);
CREATE INDEX IF NOT EXISTS idx_generated_code_created_at ON generated_code(created_at);
