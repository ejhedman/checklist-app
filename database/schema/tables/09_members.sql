-- Table: members
-- Owner: postgres
--

-- Table DDL
--
CREATE TABLE IF NOT EXISTS "public"."members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "gen_random_uuid"(),
    "email" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "nickname" "text",
    "member_role" "text" DEFAULT 'user'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    CONSTRAINT "members_role_check" CHECK (("member_role" = ANY (ARRAY['member'::"text", 'release_manager'::"text", 'admin'::"text"])))
);

-- Comments
--
COMMENT ON TABLE "public"."members" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."members"."id" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."members"."user_id" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."members"."email" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."members"."full_name" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."members"."nickname" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."members"."member_role" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."members"."created_at" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."members"."updated_at" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."members"."tenant_id" IS 'TODO: Add description.';

-- Foreign Keys
--
ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;

-- Triggers
--
CREATE OR REPLACE TRIGGER "set_members_updated_at" BEFORE UPDATE ON "public"."members" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- Privileges
--
GRANT ALL ON TABLE "public"."members" TO "anon";
GRANT ALL ON TABLE "public"."members" TO "authenticated";
GRANT ALL ON TABLE "public"."members" TO "service_role";

