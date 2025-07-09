-- Table: releases
-- Owner: postgres
--

-- Table DDL
--
CREATE TABLE IF NOT EXISTS "public"."releases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "target_date" "date" NOT NULL,
    "platform_update" boolean DEFAULT false NOT NULL,
    "config_update" boolean DEFAULT false NOT NULL,
    "state" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "release_notes" "text",
    "release_summary" "text",
    "is_archived" boolean DEFAULT false NOT NULL,
    "targets" "jsonb" DEFAULT '[]'::"jsonb",
    "project_id" "uuid" NOT NULL,
    "is_ready" boolean DEFAULT false NOT NULL,
    CONSTRAINT "releases_state_check" CHECK (("state" = ANY (ARRAY['pending'::"text", 'ready'::"text", 'past_due'::"text", 'complete'::"text", 'cancelled'::"text"])))
);

-- Comments
--
COMMENT ON TABLE "public"."releases" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."releases"."id" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."releases"."name" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."releases"."target_date" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."releases"."platform_update" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."releases"."config_update" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."releases"."state" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."releases"."created_at" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."releases"."updated_at" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."releases"."release_notes" IS 'Markdown-formatted release notes for this release';
COMMENT ON COLUMN "public"."releases"."release_summary" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."releases"."is_archived" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."releases"."targets" IS 'Array of target short names associated with this release';
COMMENT ON COLUMN "public"."releases"."project_id" IS 'Reference to the project this release belongs to';
COMMENT ON COLUMN "public"."releases"."is_ready" IS 'Indicates whether the release is ready for deployment';

-- Foreign Keys
--
ALTER TABLE ONLY "public"."releases"
    ADD CONSTRAINT "releases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;

-- Triggers
--
CREATE OR REPLACE TRIGGER "set_releases_updated_at" BEFORE UPDATE ON "public"."releases" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- Privileges
--
GRANT ALL ON TABLE "public"."releases" TO "anon";
GRANT ALL ON TABLE "public"."releases" TO "authenticated";
GRANT ALL ON TABLE "public"."releases" TO "service_role";

