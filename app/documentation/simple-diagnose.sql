-- Get information about the foreign key constraint
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
WHERE
  tc.constraint_name = 'documentations_project_id_fkey';

-- Also check if project_id allows NULL values
SELECT 
  column_name, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'documentations'
  AND column_name = 'project_id';
