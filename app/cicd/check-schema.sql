-- Check the structure of the ci_cd_pipelines table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ci_cd_pipelines';

-- Check the foreign key constraints
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
WHERE tc.table_name = 'ci_cd_pipelines';
