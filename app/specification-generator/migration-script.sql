-- Migration script to move data from the old specifications table to the new normalized schema
-- This should be run after the new tables are created

-- First, ensure we have the required specification types
INSERT INTO specification_types (name, description)
VALUES 
    ('web', 'Web Application'),
    ('mobile', 'Mobile Application'),
    ('desktop', 'Desktop Application'),
    ('saas', 'SaaS Platform'),
    ('ecommerce', 'E-Commerce'),
    ('crm', 'CRM System'),
    ('other', 'Other')
ON CONFLICT (name) DO NOTHING;

-- Create a function to migrate the data
CREATE OR REPLACE FUNCTION migrate_specifications() RETURNS void AS $$
DECLARE
    spec_record RECORD;
    new_spec_id UUID;
    type_id UUID;
    section_id UUID;
BEGIN
    -- For each specification in the old table
    FOR spec_record IN SELECT * FROM specifications LOOP
        -- Get the type_id for this specification
        SELECT id INTO type_id FROM specification_types WHERE name = spec_record.app_type;
        
        -- If no matching type, use 'other'
        IF type_id IS NULL THEN
            SELECT id INTO type_id FROM specification_types WHERE name = 'other';
        END IF;
        
        -- Insert into the new specifications table
        INSERT INTO specifications_new (
            app_name,
            app_description,
            type_id,
            status,
            created_at,
            updated_at
        ) VALUES (
            spec_record.app_name,
            spec_record.app_description,
            type_id,
            'draft',
            spec_record.created_at,
            spec_record.updated_at
        ) RETURNING id INTO new_spec_id;
        
        -- Insert target_audience if it exists
        IF spec_record.target_audience IS NOT NULL AND spec_record.target_audience != '' THEN
            SELECT id INTO section_id FROM specification_sections WHERE name = 'target_audience';
            IF section_id IS NOT NULL THEN
                INSERT INTO specification_content (specification_id, section_id, content, created_at, updated_at)
                VALUES (new_spec_id, section_id, spec_record.target_audience, spec_record.created_at, spec_record.updated_at);
            END IF;
        END IF;
        
        -- Insert key_features if it exists
        IF spec_record.key_features IS NOT NULL AND spec_record.key_features != '' THEN
            SELECT id INTO section_id FROM specification_sections WHERE name = 'key_features';
            IF section_id IS NOT NULL THEN
                INSERT INTO specification_content (specification_id, section_id, content, created_at, updated_at)
                VALUES (new_spec_id, section_id, spec_record.key_features, spec_record.created_at, spec_record.updated_at);
            END IF;
        END IF;
        
        -- Insert technical_constraints if it exists
        IF spec_record.technical_constraints IS NOT NULL AND spec_record.technical_constraints != '' THEN
            SELECT id INTO section_id FROM specification_sections WHERE name = 'technical_constraints';
            IF section_id IS NOT NULL THEN
                INSERT INTO specification_content (specification_id, section_id, content, created_at, updated_at)
                VALUES (new_spec_id, section_id, spec_record.technical_constraints, spec_record.created_at, spec_record.updated_at);
            END IF;
        END IF;
        
        -- Insert functional_requirements if it exists
        IF spec_record.functional_requirements IS NOT NULL AND spec_record.functional_requirements != '' THEN
            SELECT id INTO section_id FROM specification_sections WHERE name = 'functional_requirements';
            IF section_id IS NOT NULL THEN
                INSERT INTO specification_content (specification_id, section_id, content, created_at, updated_at)
                VALUES (new_spec_id, section_id, spec_record.functional_requirements, spec_record.created_at, spec_record.updated_at);
            END IF;
        END IF;
        
        -- Insert non_functional_requirements if it exists
        IF spec_record.non_functional_requirements IS NOT NULL AND spec_record.non_functional_requirements != '' THEN
            SELECT id INTO section_id FROM specification_sections WHERE name = 'non_functional_requirements';
            IF section_id IS NOT NULL THEN
                INSERT INTO specification_content (specification_id, section_id, content, created_at, updated_at)
                VALUES (new_spec_id, section_id, spec_record.non_functional_requirements, spec_record.created_at, spec_record.updated_at);
            END IF;
        END IF;
        
        -- Insert system_architecture if it exists
        IF spec_record.system_architecture IS NOT NULL AND spec_record.system_architecture != '' THEN
            SELECT id INTO section_id FROM specification_sections WHERE name = 'system_architecture';
            IF section_id IS NOT NULL THEN
                INSERT INTO specification_content (specification_id, section_id, content, created_at, updated_at)
                VALUES (new_spec_id, section_id, spec_record.system_architecture, spec_record.created_at, spec_record.updated_at);
            END IF;
        END IF;
        
        -- Insert api_design if it exists
        IF spec_record.api_design IS NOT NULL AND spec_record.api_design != '' THEN
            SELECT id INTO section_id FROM specification_sections WHERE name = 'api_design';
            IF section_id IS NOT NULL THEN
                INSERT INTO specification_content (specification_id, section_id, content, created_at, updated_at)
                VALUES (new_spec_id, section_id, spec_record.api_design, spec_record.created_at, spec_record.updated_at);
            END IF;
        END IF;
        
        -- Insert database_schema if it exists
        IF spec_record.database_schema IS NOT NULL AND spec_record.database_schema != '' THEN
            SELECT id INTO section_id FROM specification_sections WHERE name = 'database_schema';
            IF section_id IS NOT NULL THEN
                INSERT INTO specification_content (specification_id, section_id, content, created_at, updated_at)
                VALUES (new_spec_id, section_id, spec_record.database_schema, spec_record.created_at, spec_record.updated_at);
            END IF;
        END IF;
        
        -- Insert scalability_considerations if it exists
        IF spec_record.scalability_considerations IS NOT NULL AND spec_record.scalability_considerations != '' THEN
            SELECT id INTO section_id FROM specification_sections WHERE name = 'scalability_considerations';
            IF section_id IS NOT NULL THEN
                INSERT INTO specification_content (specification_id, section_id, content, created_at, updated_at)
                VALUES (new_spec_id, section_id, spec_record.scalability_considerations, spec_record.created_at, spec_record.updated_at);
            END IF;
        END IF;
        
        -- Insert security_considerations if it exists
        IF spec_record.security_considerations IS NOT NULL AND spec_record.security_considerations != '' THEN
            SELECT id INTO section_id FROM specification_sections WHERE name = 'security_considerations';
            IF section_id IS NOT NULL THEN
                INSERT INTO specification_content (specification_id, section_id, content, created_at, updated_at)
                VALUES (new_spec_id, section_id, spec_record.security_considerations, spec_record.created_at, spec_record.updated_at);
            END IF;
        END IF;
        
        -- Insert deployment_plan if it exists
        IF spec_record.deployment_plan IS NOT NULL AND spec_record.deployment_plan != '' THEN
            SELECT id INTO section_id FROM specification_sections WHERE name = 'deployment_plan';
            IF section_id IS NOT NULL THEN
                INSERT INTO specification_content (specification_id, section_id, content, created_at, updated_at)
                VALUES (new_spec_id, section_id, spec_record.deployment_plan, spec_record.created_at, spec_record.updated_at);
            END IF;
        END IF;
        
        -- Insert monitoring_logging if it exists
        IF spec_record.monitoring_logging IS NOT NULL AND spec_record.monitoring_logging != '' THEN
            SELECT id INTO section_id FROM specification_sections WHERE name = 'monitoring_logging';
            IF section_id IS NOT NULL THEN
                INSERT INTO specification_content (specification_id, section_id, content, created_at, updated_at)
                VALUES (new_spec_id, section_id, spec_record.monitoring_logging, spec_record.created_at, spec_record.updated_at);
            END IF;
        END IF;
        
        -- Insert future_enhancements if it exists
        IF spec_record.future_enhancements IS NOT NULL AND spec_record.future_enhancements != '' THEN
            SELECT id INTO section_id FROM specification_sections WHERE name = 'future_enhancements';
            IF section_id IS NOT NULL THEN
                INSERT INTO specification_content (specification_id, section_id, content, created_at, updated_at)
                VALUES (new_spec_id, section_id, spec_record.future_enhancements, spec_record.created_at, spec_record.updated_at);
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration function
SELECT migrate_specifications();

-- Drop the function after use
DROP FUNCTION migrate_specifications();
