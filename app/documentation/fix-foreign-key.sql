-- Check the current constraint
SELECT tc.constraint_name, 
       tc.table_name, 
       kcu.column_name, 
       ccu.table_name AS foreign_table_name,
       ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_name = 'documentations_project_id_fkey';

-- Create a dummy record in the referenced table if needed
-- This is a fallback approach if setting NULL doesn't work
INSERT INTO specifications (id, app_name, app_description, created_at)
VALUES ('00000000-0000-0000-0000-000000000000', 'Dummy Specification', 'This is a dummy specification for documentation without a real specification', NOW())
ON CONFLICT (id) DO NOTHING;
