-- Function to get column names for a table
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS TABLE (column_name text, data_type text) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    columns.column_name::text,
    columns.data_type::text
  FROM 
    information_schema.columns
  WHERE 
    table_name = $1
    AND table_schema = 'public';
END;
$$ LANGUAGE plpgsql;
