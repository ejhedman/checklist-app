-- Migration: Remove redundant project_user_map table
-- Date: 2024-12-25
-- Description: Remove project_user_map table as it's redundant with the members table

-- Step 1: Drop foreign key constraints and indexes for project_user_map
DROP INDEX IF EXISTS "public"."idx_project_user_map_project_id";
DROP INDEX IF EXISTS "public"."idx_tenant_user_map_tenant_id";

-- Drop foreign key constraints
ALTER TABLE IF EXISTS "public"."project_user_map" DROP CONSTRAINT IF EXISTS "project_user_map_project_id_fkey";
ALTER TABLE IF EXISTS "public"."project_user_map" DROP CONSTRAINT IF EXISTS "project_user_map_user_id_fkey";
ALTER TABLE IF EXISTS "public"."project_user_map" DROP CONSTRAINT IF EXISTS "project_user_map_project_id_user_id_key";
ALTER TABLE IF EXISTS "public"."project_user_map" DROP CONSTRAINT IF EXISTS "project_user_map_pkey";

-- Step 2: Drop the project_user_map table
DROP TABLE IF EXISTS "public"."project_user_map";

-- Step 3: Drop RLS policies for project_user_map
DROP POLICY IF EXISTS "Users can delete project user mappings" ON "public"."project_user_map";
DROP POLICY IF EXISTS "Users can insert project user mappings" ON "public"."project_user_map";
DROP POLICY IF EXISTS "Users can update project user mappings" ON "public"."project_user_map";
DROP POLICY IF EXISTS "Users can view project user mappings" ON "public"."project_user_map";

-- Step 4: Drop trigger for project_user_map
DROP TRIGGER IF EXISTS "set_project_user_map_updated_at" ON "public"."project_user_map";

-- Step 5: Update comments to reflect the change
COMMENT ON TABLE "public"."members" IS 'Members represent users within a project context, mapping users to projects with additional member information';
COMMENT ON COLUMN "public"."members"."project_id" IS 'Reference to the project this member belongs to - serves as the user-project mapping'; 

DROP TABLE IF EXISTS "public"."project_user_map";