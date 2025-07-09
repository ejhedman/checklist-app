-- Table: projects
-- Owner: postgres
--

-- Table DDL
--
CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Comments
--
COMMENT ON TABLE "public"."projects" IS 'Projects represent different organizations or environments';
COMMENT ON COLUMN "public"."projects"."id" IS 'Unique identifier for the project';
COMMENT ON COLUMN "public"."projects"."name" IS 'Name of the project';
COMMENT ON COLUMN "public"."projects"."created_at" IS 'Timestamp when the project was created';
COMMENT ON COLUMN "public"."projects"."updated_at" IS 'Timestamp when the project was last updated';

-- Triggers
--
CREATE OR REPLACE TRIGGER "set_projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- Privileges
--
GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";

