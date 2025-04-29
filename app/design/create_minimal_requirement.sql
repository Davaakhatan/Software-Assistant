CREATE OR REPLACE FUNCTION create_minimal_requirement(spec_id UUID, user_id_param UUID)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  -- Insert with minimal fields and return the ID
  INSERT INTO requirements (specification_id, user_id)
  VALUES (spec_id, user_id_param)
  RETURNING id INTO new_id;
  
  RETURN new_id;
EXCEPTION WHEN OTHERS THEN
  -- Return NULL on error
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
