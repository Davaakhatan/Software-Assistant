-- This is a SQL function that can be executed in the Supabase SQL editor
-- to create a function for saving generated code

CREATE OR REPLACE FUNCTION save_generated_code(
  p_name TEXT,
  p_specification_id UUID,
  p_data JSONB
) RETURNS JSONB AS $$
DECLARE
  v_id UUID;
  v_result JSONB;
BEGIN
  -- Insert the record
  INSERT INTO generated_code (name, specification_id, data)
  VALUES (p_name, p_specification_id, p_data)
  RETURNING id INTO v_id;
  
  -- Return the result
  SELECT jsonb_build_object(
    'id', v_id,
    'name', p_name,
    'specification_id', p_specification_id
  ) INTO v_result;
  
  RETURN v_result;
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to execute arbitrary SQL (use with caution)
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE sql_query INTO result;
  RETURN result;
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
