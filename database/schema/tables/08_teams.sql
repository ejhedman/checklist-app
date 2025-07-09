-- Table: teams
-- Owner: postgres
--

-- Table DDL
--
CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "project_id" "uuid" NOT NULL
);

-- Comments
--
COMMENT ON TABLE "public"."teams" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."teams"."id" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."teams"."name" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."teams"."description" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."teams"."created_at" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."teams"."updated_at" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."teams"."project_id" IS 'Reference to the project this team belongs to';

-- Foreign Keys
--
ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;

-- Triggers
--
CREATE OR REPLACE TRIGGER "set_teams_updated_at" BEFORE UPDATE ON "public"."teams" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- Privileges
--
GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";

