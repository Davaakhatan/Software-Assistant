-- Create a new table for standalone documentation without foreign key constraints
CREATE TABLE IF NOT EXISTS standalone_docs (
  id SERIAL PRIMARY KEY,
  doc_name VARCHAR(255) NOT NULL,
  doc_type VARCHAR(50) NOT NULL,
  doc_content TEXT NOT NULL,
  project_description TEXT NOT NULL,
  related_ids JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant appropriate permissions
ALTER TABLE standalone_docs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON standalone_docs
  USING (true)
  WITH CHECK (true);
