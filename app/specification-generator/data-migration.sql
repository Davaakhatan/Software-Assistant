-- This script migrates data from the old specifications table to the new normalized schema

-- First, ensure we have the uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Create a temporary table to store mappings between old and new IDs
CREATE TEMP TABLE spec_id_mapping (
    old_id UUID,
    new_id UUID
);

-- Step 2: Insert data into specifications_new and track ID mappings
INSERT INTO specifications_new (
    id,
    app_name,
    app_description,
    type_id,
    status,
    created_at,
    updated_at
)
SELECT 
    uuid_generate_v4() as id,
    app_name,
    app_description,
    (SELECT id FROM specification_types WHERE name = COALESCE(app_type, 'other')),
    'active' as status,
    created_at,
    updated_at
FROM specifications
RETURNING id, (SELECT id FROM specifications WHERE app_name = specifications_new.app_name LIMIT 1) as old_id
INTO TEMP spec_id_mapping;

-- Step 3: Insert content for each section from the old table
-- Target Audience
INSERT INTO specification_content (
    specification_id,
    section_id,
    content,
    created_at,
    updated_at
)
SELECT 
    m.new_id,
    (SELECT id FROM specification_sections WHERE name = 'target_audience'),
    s.target_audience,
    s.created_at,
    s.updated_at
FROM specifications s
JOIN spec_id_mapping m ON s.id = m.old_id
WHERE s.target_audience IS NOT NULL AND s.target_audience != '';

-- Key Features
INSERT INTO specification_content (
    specification_id,
    section_id,
    content,
    created_at,
    updated_at
)
SELECT 
    m.new_id,
    (SELECT id FROM specification_sections WHERE name = 'key_features'),
    s.key_features,
    s.created_at,
    s.updated_at
FROM specifications s
JOIN spec_id_mapping m ON s.id = m.old_id
WHERE s.key_features IS NOT NULL AND s.key_features != '';

-- Technical Constraints
INSERT INTO specification_content (
    specification_id,
    section_id,
    content,
    created_at,
    updated_at
)
SELECT 
    m.new_id,
    (SELECT id FROM specification_sections WHERE name = 'technical_constraints'),
    s.technical_constraints,
    s.created_at,
    s.updated_at
FROM specifications s
JOIN spec_id_mapping m ON s.id = m.old_id
WHERE s.technical_constraints IS NOT NULL AND s.technical_constraints != '';

-- Functional Requirements
INSERT INTO specification_content (
    specification_id,
    section_id,
    content,
    created_at,
    updated_at
)
SELECT 
    m.new_id,
    (SELECT id FROM specification_sections WHERE name = 'functional_requirements'),
    s.functional_requirements,
    s.created_at,
    s.updated_at
FROM specifications s
JOIN spec_id_mapping m ON s.id = m.old_id
WHERE s.functional_requirements IS NOT NULL AND s.functional_requirements != '';

-- Non-Functional Requirements
INSERT INTO specification_content (
    specification_id,
    section_id,
    content,
    created_at,
    updated_at
)
SELECT 
    m.new_id,
    (SELECT id FROM specification_sections WHERE name = 'non_functional_requirements'),
    s.non_functional_requirements,
    s.created_at,
    s.updated_at
FROM specifications s
JOIN spec_id_mapping m ON s.id = m.old_id
WHERE s.non_functional_requirements IS NOT NULL AND s.non_functional_requirements != '';

-- System Architecture
INSERT INTO specification_content (
    specification_id,
    section_id,
    content,
    created_at,
    updated_at
)
SELECT 
    m.new_id,
    (SELECT id FROM specification_sections WHERE name = 'system_architecture'),
    s.system_architecture,
    s.created_at,
    s.updated_at
FROM specifications s
JOIN spec_id_mapping m ON s.id = m.old_id
WHERE s.system_architecture IS NOT NULL AND s.system_architecture != '';

-- API Design
INSERT INTO specification_content (
    specification_id,
    section_id,
    content,
    created_at,
    updated_at
)
SELECT 
    m.new_id,
    (SELECT id FROM specification_sections WHERE name = 'api_design'),
    s.api_design,
    s.created_at,
    s.updated_at
FROM specifications s
JOIN spec_id_mapping m ON s.id = m.old_id
WHERE s.api_design IS NOT NULL AND s.api_design != '';

-- Database Schema
INSERT INTO specification_content (
    specification_id,
    section_id,
    content,
    created_at,
    updated_at
)
SELECT 
    m.new_id,
    (SELECT id FROM specification_sections WHERE name = 'database_schema'),
    s.database_schema,
    s.created_at,
    s.updated_at
FROM specifications s
JOIN spec_id_mapping m ON s.id = m.old_id
WHERE s.database_schema IS NOT NULL AND s.database_schema != '';

-- Scalability Considerations
INSERT INTO specification_content (
    specification_id,
    section_id,
    content,
    created_at,
    updated_at
)
SELECT 
    m.new_id,
    (SELECT id FROM specification_sections WHERE name = 'scalability_considerations'),
    s.scalability_considerations,
    s.created_at,
    s.updated_at
FROM specifications s
JOIN spec_id_mapping m ON s.id = m.old_id
WHERE s.scalability_considerations IS NOT NULL AND s.scalability_considerations != '';

-- Security Considerations
INSERT INTO specification_content (
    specification_id,
    section_id,
    content,
    created_at,
    updated_at
)
SELECT 
    m.new_id,
    (SELECT id FROM specification_sections WHERE name = 'security_considerations'),
    s.security_considerations,
    s.created_at,
    s.updated_at
FROM specifications s
JOIN spec_id_mapping m ON s.id = m.old_id
WHERE s.security_considerations IS NOT NULL AND s.security_considerations != '';

-- Deployment Plan
INSERT INTO specification_content (
    specification_id,
    section_id,
    content,
    created_at,
    updated_at
)
SELECT 
    m.new_id,
    (SELECT id FROM specification_sections WHERE name = 'deployment_plan'),
    s.deployment_plan,
    s.created_at,
    s.updated_at
FROM specifications s
JOIN spec_id_mapping m ON s.id = m.old_id
WHERE s.deployment_plan IS NOT NULL AND s.deployment_plan != '';

-- Monitoring and Logging
INSERT INTO specification_content (
    specification_id,
    section_id,
    content,
    created_at,
    updated_at
)
SELECT 
    m.new_id,
    (SELECT id FROM specification_sections WHERE name = 'monitoring_logging'),
    s.monitoring_logging,
    s.created_at,
    s.updated_at
FROM specifications s
JOIN spec_id_mapping m ON s.id = m.old_id
WHERE s.monitoring_logging IS NOT NULL AND s.monitoring_logging != '';

-- Future Enhancements
INSERT INTO specification_content (
    specification_id,
    section_id,
    content,
    created_at,
    updated_at
)
SELECT 
    m.new_id,
    (SELECT id FROM specification_sections WHERE name = 'future_enhancements'),
    s.future_enhancements,
    s.created_at,
    s.updated_at
FROM specifications s
JOIN spec_id_mapping m ON s.id = m.old_id
WHERE s.future_enhancements IS NOT NULL AND s.future_enhancements != '';

-- Step 4: Update code_generations table to point to new specification IDs
UPDATE code_generations
SET specification_id = m.new_id
FROM spec_id_mapping m
WHERE code_generations.specification_id = m.old_id;

-- Step 5: Update designs table to point to new specification IDs
UPDATE designs
SET requirement_id = m.new_id
FROM spec_id_mapping m
WHERE designs.requirement_id = m.old_id;

-- Step 6: Update ci_cd_pipelines table to point to new specification IDs
UPDATE ci_cd_pipelines
SET specification_id = m.new_id
FROM spec_id_mapping m
WHERE ci_cd_pipelines.specification_id = m.old_id;

-- Drop the temporary table
DROP TABLE spec_id_mapping;
