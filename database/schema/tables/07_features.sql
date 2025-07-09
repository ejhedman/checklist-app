-- Table: features
-- Owner: postgres
--

-- Table DDL
--
CREATE TABLE IF NOT EXISTS "public"."features" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "release_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "jira_ticket" "text",
    "description" "text",
    "is_platform" boolean DEFAULT false NOT NULL,
    "is_ready" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_config" boolean DEFAULT false NOT NULL,
    "comments" "text",
    "dri_member_id" "uuid",
    "project_id" "uuid" NOT NULL
);

-- Comments
--
COMMENT ON TABLE "public"."features" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."features"."id" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."features"."release_id" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."features"."name" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."features"."jira_ticket" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."features"."description" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."features"."is_platform" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."features"."is_ready" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."features"."created_at" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."features"."updated_at" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."features"."is_config" IS 'Indicates if this feature is a configuration change (peer to is_platform)';
COMMENT ON COLUMN "public"."features"."comments" IS 'User comments/notes about the feature status';
COMMENT ON COLUMN "public"."features"."dri_member_id" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."features"."project_id" IS 'Reference to the project this feature belongs to';

-- Foreign Keys
--
ALTER TABLE ONLY "public"."features"
    ADD CONSTRAINT "features_dri_member_id_fkey" FOREIGN KEY ("dri_member_id") REFERENCES "public"."members"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "public"."features"
    ADD CONSTRAINT "features_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."features"
    ADD CONSTRAINT "features_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;

-- Triggers
--
CREATE OR REPLACE TRIGGER "set_features_updated_at" BEFORE UPDATE ON "public"."features" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- Privileges
--
GRANT ALL ON TABLE "public"."features" TO "anon";
GRANT ALL ON TABLE "public"."features" TO "authenticated";
GRANT ALL ON TABLE "public"."features" TO "service_role";

