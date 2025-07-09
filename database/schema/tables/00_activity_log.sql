-- Table: activity_log
-- Owner: postgres
--

-- Table DDL
--
CREATE TABLE IF NOT EXISTS "public"."activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "release_id" "uuid",
    "feature_id" "uuid",
    "team_id" "uuid",
    "activity_type" "text" NOT NULL,
    "activity_details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "member_id" "uuid",
    "project_id" "uuid" NOT NULL
);

-- Comments
--
COMMENT ON TABLE "public"."activity_log" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."activity_log"."id" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."activity_log"."release_id" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."activity_log"."feature_id" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."activity_log"."team_id" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."activity_log"."activity_type" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."activity_log"."activity_details" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."activity_log"."created_at" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."activity_log"."member_id" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."activity_log"."project_id" IS 'Reference to the project this activity belongs to';

-- Foreign Keys
--
ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;

-- Triggers
--
CREATE OR REPLACE TRIGGER "set_activity_log_updated_at" BEFORE UPDATE ON "public"."activity_log" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- Privileges
--
GRANT ALL ON TABLE "public"."activity_log" TO "anon";
GRANT ALL ON TABLE "public"."activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log" TO "service_role";

