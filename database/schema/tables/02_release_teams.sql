-- Table: release_teams
-- Owner: postgres
--

-- Table DDL
--
CREATE TABLE IF NOT EXISTS "public"."release_teams" (
    "release_id" "uuid" NOT NULL,
    "team_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tenant_id" "uuid" NOT NULL
);

-- Comments
--
COMMENT ON TABLE "public"."release_teams" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."release_teams"."release_id" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."release_teams"."team_id" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."release_teams"."created_at" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."release_teams"."updated_at" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."release_teams"."tenant_id" IS 'TODO: Add description.';

-- Foreign Keys
--
ALTER TABLE ONLY "public"."release_teams"
    ADD CONSTRAINT "release_teams_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."release_teams"
    ADD CONSTRAINT "release_teams_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."release_teams"
    ADD CONSTRAINT "release_teams_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;

-- Triggers
--
CREATE OR REPLACE TRIGGER "set_release_teams_updated_at" BEFORE UPDATE ON "public"."release_teams" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- Privileges
--
GRANT ALL ON TABLE "public"."release_teams" TO "anon";
GRANT ALL ON TABLE "public"."release_teams" TO "authenticated";
GRANT ALL ON TABLE "public"."release_teams" TO "service_role";

