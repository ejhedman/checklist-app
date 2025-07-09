-- Table: project_user_map
-- Owner: postgres
--

-- Table DDL
--
CREATE TABLE IF NOT EXISTS "public"."project_user_map" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Comments
--
COMMENT ON TABLE "public"."project_user_map" IS 'Maps users to projects they have access to';
COMMENT ON COLUMN "public"."project_user_map"."id" IS 'Unique identifier for the mapping';
COMMENT ON COLUMN "public"."project_user_map"."project_id" IS 'Reference to the project';
COMMENT ON COLUMN "public"."project_user_map"."user_id" IS 'Reference to the user';
COMMENT ON COLUMN "public"."project_user_map"."created_at" IS 'Timestamp when the mapping was created';
COMMENT ON COLUMN "public"."project_user_map"."updated_at" IS 'Timestamp when the mapping was last updated';

-- Foreign Keys
--
ALTER TABLE ONLY "public"."project_user_map"
    ADD CONSTRAINT "project_user_map_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."project_user_map"
    ADD CONSTRAINT "project_user_map_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."members"("user_id") ON DELETE CASCADE;

-- Triggers
--
CREATE OR REPLACE TRIGGER "set_project_user_map_updated_at" BEFORE UPDATE ON "public"."project_user_map" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- Privileges
--
GRANT ALL ON TABLE "public"."project_user_map" TO "anon";
GRANT ALL ON TABLE "public"."project_user_map" TO "authenticated";
GRANT ALL ON TABLE "public"."project_user_map" TO "service_role";

