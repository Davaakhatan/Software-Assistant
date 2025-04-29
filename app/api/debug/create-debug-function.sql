-- Create a function to get CI/CD pipelines directly
CREATE OR REPLACE FUNCTION get_cicd_pipelines()
RETURNS TABLE (
  id uuid,
  platform text,
  project_name text,
  generated_config text,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  -- Try to query the ci_cd_pipelines table
  BEGIN
    RETURN QUERY SELECT 
      p.id, 
      p.platform, 
      p.project_name, 
      p.generated_config, 
      p.created_at, 
      p.updated_at
    FROM ci_cd_pipelines p
    ORDER BY p.created_at DESC;
  EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist, return empty result
    RETURN;
  END;
END;
$$ LANGUAGE plpgsql;
