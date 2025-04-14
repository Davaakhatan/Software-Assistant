-- Function to check if a column exists in a table
CREATE OR REPLACE FUNCTION check_column_exists(p_table text, p_column text)
RETURNS boolean AS $$
DECLARE
  column_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = p_table
    AND column_name = p_column
  ) INTO column_exists;
  
  RETURN column_exists;
END;
$$ LANGUAGE plpgsql;

-- Function to add a column if it doesn't exist
CREATE OR REPLACE FUNCTION add_column_if_not_exists(p_table text, p_column text, p_type text)
RETURNS void AS $$
BEGIN
  IF NOT check_column_exists(p_table, p_column) THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS %I %s', p_table, p_column, p_type);
  END IF;
END;
$$ LANGUAGE plpgsql;
