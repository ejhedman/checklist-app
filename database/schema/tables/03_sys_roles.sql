-- Table: sys_roles
-- Owner: postgres
--

-- Table DDL
--
CREATE TABLE IF NOT EXISTS "public"."sys_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "sys_role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_roles_role_check" CHECK (("sys_role" = ANY (ARRAY['admin'::"text", 'user'::"text"])))
);

-- Comments
--
COMMENT ON TABLE "public"."sys_roles" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."sys_roles"."id" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."sys_roles"."user_id" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."sys_roles"."sys_role" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."sys_roles"."created_at" IS 'TODO: Add description.';
COMMENT ON COLUMN "public"."sys_roles"."updated_at" IS 'TODO: Add description.';

-- Triggers
--
CREATE OR REPLACE TRIGGER "update_uroles_updated_at" BEFORE UPDATE ON "public"."sys_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Privileges
--
GRANT ALL ON TABLE "public"."sys_roles" TO "anon";
GRANT ALL ON TABLE "public"."sys_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."sys_roles" TO "service_role";

