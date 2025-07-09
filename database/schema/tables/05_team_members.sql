-- Table: team_members
-- Owner: postgres
--

-- Table DDL
--
CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "team_id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "project_id" "uuid" NOT NULL
);

-- Comments
--
COMMENT ON TABLE "public"."team_members" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."team_members"."team_id" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."team_members"."member_id" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."team_members"."created_at" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."team_members"."updated_at" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."team_members"."project_id" IS 'Reference to the project this team member belongs to';

-- Foreign Keys
--
ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;

-- Triggers
--
CREATE OR REPLACE TRIGGER "set_team_members_updated_at" BEFORE UPDATE ON "public"."team_members" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- Privileges
--
GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";

