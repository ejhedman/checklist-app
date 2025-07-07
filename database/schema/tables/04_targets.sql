-- Table: targets
-- Owner: postgres
--

-- Table DDL
--
CREATE TABLE IF NOT EXISTS "public"."targets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "short_name" "text" NOT NULL,
    "name" "text" NOT NULL,
    "is_live" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tenant_id" "uuid" NOT NULL
);

-- Comments
--
COMMENT ON TABLE "public"."targets" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."targets"."id" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."targets"."short_name" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."targets"."name" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."targets"."is_live" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."targets"."created_at" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."targets"."updated_at" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."targets"."tenant_id" IS 'TODO: Add description.';

-- Foreign Keys
--
ALTER TABLE ONLY "public"."targets"
    ADD CONSTRAINT "targets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;

-- Triggers
--
CREATE OR REPLACE TRIGGER "set_targets_updated_at" BEFORE UPDATE ON "public"."targets" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- Privileges
--
GRANT ALL ON TABLE "public"."targets" TO "anon";
GRANT ALL ON TABLE "public"."targets" TO "authenticated";
GRANT ALL ON TABLE "public"."targets" TO "service_role";

