-- Table: tenant_user_map
-- Owner: postgres
--

-- Table DDL
--
CREATE TABLE IF NOT EXISTS "public"."tenant_user_map" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Comments
--
COMMENT ON TABLE "public"."tenant_user_map" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."tenant_user_map"."id" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."tenant_user_map"."tenant_id" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."tenant_user_map"."user_id" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."tenant_user_map"."created_at" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."tenant_user_map"."updated_at" IS 'TODO: Add description.';

-- Foreign Keys
--
ALTER TABLE ONLY "public"."tenant_user_map"
    ADD CONSTRAINT "tenant_user_map_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."tenant_user_map"
    ADD CONSTRAINT "tenant_user_map_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."members"("user_id") ON DELETE CASCADE;

-- Triggers
--
CREATE OR REPLACE TRIGGER "set_tenant_user_map_updated_at" BEFORE UPDATE ON "public"."tenant_user_map" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- Privileges
--
GRANT ALL ON TABLE "public"."tenant_user_map" TO "anon";
GRANT ALL ON TABLE "public"."tenant_user_map" TO "authenticated";
GRANT ALL ON TABLE "public"."tenant_user_map" TO "service_role";

