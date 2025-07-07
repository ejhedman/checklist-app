-- Table: tenants
-- Owner: postgres
--

-- Table DDL
--
CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Comments
--
COMMENT ON TABLE "public"."tenants" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."tenants"."id" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."tenants"."name" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."tenants"."created_at" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."tenants"."updated_at" IS 'TODO: Add description.';

-- Triggers
--
CREATE OR REPLACE TRIGGER "set_tenants_updated_at" BEFORE UPDATE ON "public"."tenants" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- Privileges
--
GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";

