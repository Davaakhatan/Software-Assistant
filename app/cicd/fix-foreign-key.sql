-- Check the foreign key constraint details
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM
  information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_name = 'ci_cd_pipelines_project_id_fkey';

-- Drop the foreign key constraint
ALTER TABLE ci_cd_pipelines
DROP CONSTRAINT IF EXISTS ci_cd_pipelines_project_id_fkey;

-- Make project_id nullable
ALTER TABLE ci_cd_pipelines
ALTER COLUMN project_id DROP NOT NULL;
