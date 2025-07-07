-- Table: member_release_state
-- Owner: postgres
--

-- Table DDL
--
CREATE TABLE IF NOT EXISTS "public"."member_release_state" (
    "release_id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "is_ready" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tenant_id" "uuid" NOT NULL
);

-- Comments
--
COMMENT ON TABLE "public"."member_release_state" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."member_release_state"."release_id" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."member_release_state"."member_id" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."member_release_state"."is_ready" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."member_release_state"."created_at" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."member_release_state"."updated_at" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."member_release_state"."tenant_id" IS 'TODO: Add description.';

-- Foreign Keys
--
ALTER TABLE ONLY "public"."member_release_state"
    ADD CONSTRAINT "member_release_state_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "public"."member_release_state"
    ADD CONSTRAINT "member_release_state_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."member_release_state"
    ADD CONSTRAINT "member_release_state_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;

-- Triggers
--
CREATE OR REPLACE TRIGGER "set_member_release_state_updated_at" BEFORE UPDATE ON "public"."member_release_state" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- Privileges
--
GRANT ALL ON TABLE "public"."member_release_state" TO "anon";
GRANT ALL ON TABLE "public"."member_release_state" TO "authenticated";
GRANT ALL ON TABLE "public"."member_release_state" TO "service_role";

