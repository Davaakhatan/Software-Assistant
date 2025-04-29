-- This is a diagnostic script to check the structure of the requirements table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'requirements'
  AND table_schema = 'public'
ORDER BY 
  ordinal_position;

-- Check for constraints
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM
  information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE
  tc.table_name = 'requirements'
  AND tc.table_schema = 'public';

-- Check for default values
SELECT
  column_name,
  column_default
FROM
  information_schema.columns
WHERE
  table_name = 'requirements'
  AND table_schema = 'public'
  AND column_default IS NOT NULL;
