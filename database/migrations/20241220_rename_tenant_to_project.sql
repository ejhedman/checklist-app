-- Migration: Rename tenant to project
-- Date: 2024-12-20
-- Description: Rename tenants table to projects, tenant_user_map to project_user_map, and all tenant_id columns to project_id

-- Step 1: Drop foreign key constraints that reference tenants table
ALTER TABLE IF EXISTS "public"."activity_log" DROP CONSTRAINT IF EXISTS "activity_log_tenant_id_fkey";
ALTER TABLE IF EXISTS "public"."features" DROP CONSTRAINT IF EXISTS "features_tenant_id_fkey";
ALTER TABLE IF EXISTS "public"."member_release_state" DROP CONSTRAINT IF EXISTS "member_release_state_tenant_id_fkey";
ALTER TABLE IF EXISTS "public"."members" DROP CONSTRAINT IF EXISTS "members_tenant_id_fkey";
ALTER TABLE IF EXISTS "public"."release_teams" DROP CONSTRAINT IF EXISTS "release_teams_tenant_id_fkey";
ALTER TABLE IF EXISTS "public"."releases" DROP CONSTRAINT IF EXISTS "releases_tenant_id_fkey";
ALTER TABLE IF EXISTS "public"."targets" DROP CONSTRAINT IF EXISTS "targets_tenant_id_fkey";
ALTER TABLE IF EXISTS "public"."team_members" DROP CONSTRAINT IF EXISTS "team_members_tenant_id_fkey";
ALTER TABLE IF EXISTS "public"."teams" DROP CONSTRAINT IF EXISTS "teams_tenant_id_fkey";
ALTER TABLE IF EXISTS "public"."tenant_user_map" DROP CONSTRAINT IF EXISTS "tenant_user_map_tenant_id_fkey";

-- Step 2: Drop indexes on tenant_id columns
DROP INDEX IF EXISTS "public"."idx_activity_log_tenant_id";
DROP INDEX IF EXISTS "public"."idx_features_tenant_id";
DROP INDEX IF EXISTS "public"."idx_member_release_state_tenant_id";
DROP INDEX IF EXISTS "public"."idx_members_tenant_id";
DROP INDEX IF EXISTS "public"."idx_release_teams_tenant_id";
DROP INDEX IF EXISTS "public"."idx_releases_tenant_id";
DROP INDEX IF EXISTS "public"."idx_targets_tenant_id";
DROP INDEX IF EXISTS "public"."idx_team_members_tenant_id";
DROP INDEX IF EXISTS "public"."idx_teams_tenant_id";
DROP INDEX IF EXISTS "public"."idx_tenant_user_map_tenant_id";

-- Step 3: Rename tenant_id columns to project_id
ALTER TABLE IF EXISTS "public"."activity_log" RENAME COLUMN "tenant_id" TO "project_id";
ALTER TABLE IF EXISTS "public"."features" RENAME COLUMN "tenant_id" TO "project_id";
ALTER TABLE IF EXISTS "public"."member_release_state" RENAME COLUMN "tenant_id" TO "project_id";
ALTER TABLE IF EXISTS "public"."members" RENAME COLUMN "tenant_id" TO "project_id";
ALTER TABLE IF EXISTS "public"."release_teams" RENAME COLUMN "tenant_id" TO "project_id";
ALTER TABLE IF EXISTS "public"."releases" RENAME COLUMN "tenant_id" TO "project_id";
ALTER TABLE IF EXISTS "public"."targets" RENAME COLUMN "tenant_id" TO "project_id";
ALTER TABLE IF EXISTS "public"."team_members" RENAME COLUMN "tenant_id" TO "project_id";
ALTER TABLE IF EXISTS "public"."teams" RENAME COLUMN "tenant_id" TO "project_id";
ALTER TABLE IF EXISTS "public"."tenant_user_map" RENAME COLUMN "tenant_id" TO "project_id";

-- Step 4: Rename tables
ALTER TABLE IF EXISTS "public"."tenants" RENAME TO "projects";
ALTER TABLE IF EXISTS "public"."tenant_user_map" RENAME TO "project_user_map";

-- Step 5: Drop and recreate constraints with new names
-- Drop old constraints
ALTER TABLE IF EXISTS "public"."project_user_map" DROP CONSTRAINT IF EXISTS "tenant_user_map_pkey";
ALTER TABLE IF EXISTS "public"."project_user_map" DROP CONSTRAINT IF EXISTS "tenant_user_map_tenant_id_user_id_key";
ALTER TABLE IF EXISTS "public"."project_user_map" DROP CONSTRAINT IF EXISTS "tenant_user_map_user_id_fkey";

-- Recreate constraints with new names
ALTER TABLE ONLY "public"."project_user_map"
    ADD CONSTRAINT "project_user_map_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."project_user_map"
    ADD CONSTRAINT "project_user_map_project_id_user_id_key" UNIQUE ("project_id", "user_id");

ALTER TABLE ONLY "public"."project_user_map"
    ADD CONSTRAINT "project_user_map_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."members"("user_id") ON DELETE CASCADE;

-- Step 6: Add foreign key constraints with new names
ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."features"
    ADD CONSTRAINT "features_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."member_release_state"
    ADD CONSTRAINT "member_release_state_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."release_teams"
    ADD CONSTRAINT "release_teams_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."releases"
    ADD CONSTRAINT "releases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."targets"
    ADD CONSTRAINT "targets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."project_user_map"
    ADD CONSTRAINT "project_user_map_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;

-- Step 7: Create new indexes with project_id
CREATE INDEX "idx_activity_log_project_id" ON "public"."activity_log" USING "btree" ("project_id");
CREATE INDEX "idx_features_project_id" ON "public"."features" USING "btree" ("project_id");
CREATE INDEX "idx_member_release_state_project_id" ON "public"."member_release_state" USING "btree" ("project_id");
CREATE INDEX "idx_members_project_id" ON "public"."members" USING "btree" ("project_id");
CREATE INDEX "idx_release_teams_project_id" ON "public"."release_teams" USING "btree" ("project_id");
CREATE INDEX "idx_releases_project_id" ON "public"."releases" USING "btree" ("project_id");
CREATE INDEX "idx_targets_project_id" ON "public"."targets" USING "btree" ("project_id");
CREATE INDEX "idx_team_members_project_id" ON "public"."team_members" USING "btree" ("project_id");
CREATE INDEX "idx_teams_project_id" ON "public"."teams" USING "btree" ("project_id");
CREATE INDEX "idx_project_user_map_project_id" ON "public"."project_user_map" USING "btree" ("project_id");

-- Step 8: Update comments
COMMENT ON TABLE "public"."projects" IS 'Projects represent different organizations or environments';
COMMENT ON COLUMN "public"."projects"."id" IS 'Unique identifier for the project';
COMMENT ON COLUMN "public"."projects"."name" IS 'Name of the project';
COMMENT ON COLUMN "public"."projects"."created_at" IS 'Timestamp when the project was created';
COMMENT ON COLUMN "public"."projects"."updated_at" IS 'Timestamp when the project was last updated';

COMMENT ON TABLE "public"."project_user_map" IS 'Maps users to projects they have access to';
COMMENT ON COLUMN "public"."project_user_map"."id" IS 'Unique identifier for the mapping';
COMMENT ON COLUMN "public"."project_user_map"."project_id" IS 'Reference to the project';
COMMENT ON COLUMN "public"."project_user_map"."user_id" IS 'Reference to the user';
COMMENT ON COLUMN "public"."project_user_map"."created_at" IS 'Timestamp when the mapping was created';
COMMENT ON COLUMN "public"."project_user_map"."updated_at" IS 'Timestamp when the mapping was last updated';

-- Update column comments for project_id columns
COMMENT ON COLUMN "public"."activity_log"."project_id" IS 'Reference to the project this activity belongs to';
COMMENT ON COLUMN "public"."features"."project_id" IS 'Reference to the project this feature belongs to';
COMMENT ON COLUMN "public"."member_release_state"."project_id" IS 'Reference to the project this member release state belongs to';
COMMENT ON COLUMN "public"."members"."project_id" IS 'Reference to the project this member belongs to';
COMMENT ON COLUMN "public"."release_teams"."project_id" IS 'Reference to the project this release team belongs to';
COMMENT ON COLUMN "public"."releases"."project_id" IS 'Reference to the project this release belongs to';
COMMENT ON COLUMN "public"."targets"."project_id" IS 'Reference to the project this target belongs to';
COMMENT ON COLUMN "public"."team_members"."project_id" IS 'Reference to the project this team member belongs to';
COMMENT ON COLUMN "public"."teams"."project_id" IS 'Reference to the project this team belongs to';

-- Step 9: Update RLS policies (drop old ones and create new ones)
-- Drop old policies
DROP POLICY IF EXISTS "Users can delete tenants" ON "public"."projects";
DROP POLICY IF EXISTS "Users can insert tenants" ON "public"."projects";
DROP POLICY IF EXISTS "Users can update tenants" ON "public"."projects";
DROP POLICY IF EXISTS "Users can view all tenants" ON "public"."projects";
DROP POLICY IF EXISTS "Users can delete tenant user mappings" ON "public"."project_user_map";
DROP POLICY IF EXISTS "Users can insert tenant user mappings" ON "public"."project_user_map";
DROP POLICY IF EXISTS "Users can update tenant user mappings" ON "public"."project_user_map";
DROP POLICY IF EXISTS "Users can view tenant user mappings" ON "public"."project_user_map";

-- Create new policies
CREATE POLICY "Users can delete projects" ON "public"."projects" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));
CREATE POLICY "Users can insert projects" ON "public"."projects" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));
CREATE POLICY "Users can update projects" ON "public"."projects" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));
CREATE POLICY "Users can view all projects" ON "public"."projects" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));

CREATE POLICY "Users can delete project user mappings" ON "public"."project_user_map" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));
CREATE POLICY "Users can insert project user mappings" ON "public"."project_user_map" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));
CREATE POLICY "Users can update project user mappings" ON "public"."project_user_map" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));
CREATE POLICY "Users can view project user mappings" ON "public"."project_user_map" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));

-- Step 10: Update trigger names
DROP TRIGGER IF EXISTS "set_tenants_updated_at" ON "public"."projects";
DROP TRIGGER IF EXISTS "set_tenant_user_map_updated_at" ON "public"."project_user_map";

CREATE OR REPLACE TRIGGER "set_projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
CREATE OR REPLACE TRIGGER "set_project_user_map_updated_at" BEFORE UPDATE ON "public"."project_user_map" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- Step 11: Update table privileges
GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";

GRANT ALL ON TABLE "public"."project_user_map" TO "anon";
GRANT ALL ON TABLE "public"."project_user_map" TO "authenticated";
GRANT ALL ON TABLE "public"."project_user_map" TO "service_role"; 