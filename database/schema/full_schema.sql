--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";

--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


--
-- Name: create_member_from_auth_user("uuid", "text", "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."create_member_from_auth_user"("auth_user_id" "uuid", "nickname" "text" DEFAULT NULL::"text", "member_role" "text" DEFAULT 'member'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  member_user_id uuid;
BEGIN
  -- Get auth user details
  SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name
  INTO member_user_id, member_user_id, member_user_id
  FROM auth.users au
  WHERE au.id = auth_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auth user not found';
  END IF;
  
  -- Insert into members table using member_role column
  INSERT INTO members (id, user_id, email, full_name, nickname, member_role)
  VALUES (
    gen_random_uuid(),
    auth_user_id,
    (SELECT email FROM auth.users WHERE id = auth_user_id),
    (SELECT COALESCE(raw_user_meta_data->>'full_name', email) FROM auth.users WHERE id = auth_user_id),
    nickname,
    member_role
  )
  ON CONFLICT (user_id) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    member_role = EXCLUDED.member_role,
    updated_at = now()
  RETURNING user_id INTO member_user_id;
  
  RETURN member_user_id;
END;
$$;


ALTER FUNCTION "public"."create_member_from_auth_user"("auth_user_id" "uuid", "nickname" "text", "member_role" "text") OWNER TO "postgres";

--
-- Name: get_auth_users_by_email("text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_auth_users_by_email"("email_substring" "text") RETURNS TABLE("id" "uuid", "email" "text", "full_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name
  FROM auth.users au
  WHERE au.email ILIKE '%' || email_substring || '%'
    AND au.email_confirmed_at IS NOT NULL
  ORDER BY au.email
  LIMIT 10;
END;
$$;


ALTER FUNCTION "public"."get_auth_users_by_email"("email_substring" "text") OWNER TO "postgres";

--
-- Name: get_user_role("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_user_role"("user_uuid" "uuid" DEFAULT "auth"."uid"()) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM uroles 
    WHERE user_id = user_uuid
  );
END;
$$;


ALTER FUNCTION "public"."get_user_role"("user_uuid" "uuid") OWNER TO "postgres";

--
-- Name: is_admin("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."is_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id AND role = 'admin'
    );
END;
$$;


ALTER FUNCTION "public"."is_admin"("user_id" "uuid") OWNER TO "postgres";

--
-- Name: FUNCTION "is_admin"("user_id" "uuid"); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."is_admin"("user_id" "uuid") IS 'Check if a user has admin role';


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

--
-- Name: set_user_role("uuid", "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."set_user_role"("user_uuid" "uuid", "new_role" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO uroles (user_id, role)
  VALUES (user_uuid, new_role)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    role = EXCLUDED.role,
    updated_at = now();
END;
$$;


ALTER FUNCTION "public"."set_user_role"("user_uuid" "uuid", "new_role" "text") OWNER TO "postgres";

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: activity_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "release_id" "uuid",
    "feature_id" "uuid",
    "team_id" "uuid",
    "activity_type" "text" NOT NULL,
    "activity_details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "member_id" "uuid",
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."activity_log" OWNER TO "postgres";

--
-- Name: TABLE "activity_log"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."activity_log" IS 'TODO: Add description.';


--
-- Name: COLUMN "activity_log"."id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."activity_log"."id" IS 'TODO: Add description.';


--
-- Name: COLUMN "activity_log"."release_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."activity_log"."release_id" IS 'TODO: Add description.';


--
-- Name: COLUMN "activity_log"."feature_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."activity_log"."feature_id" IS 'TODO: Add description.';


--
-- Name: COLUMN "activity_log"."team_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."activity_log"."team_id" IS 'TODO: Add description.';


--
-- Name: COLUMN "activity_log"."activity_type"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."activity_log"."activity_type" IS 'TODO: Add description.';


--
-- Name: COLUMN "activity_log"."activity_details"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."activity_log"."activity_details" IS 'TODO: Add description.';


--
-- Name: COLUMN "activity_log"."created_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."activity_log"."created_at" IS 'TODO: Add description.';


--
-- Name: COLUMN "activity_log"."member_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."activity_log"."member_id" IS 'TODO: Add description.';


--
-- Name: COLUMN "activity_log"."tenant_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."activity_log"."tenant_id" IS 'TODO: Add description.';


--
-- Name: features; Type: TABLE; Schema: public; Owner: postgres
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
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."features" OWNER TO "postgres";

--
-- Name: TABLE "features"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."features" IS 'TODO: Add description.';


--
-- Name: COLUMN "features"."id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."features"."id" IS 'TODO: Add description.';


--
-- Name: COLUMN "features"."release_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."features"."release_id" IS 'TODO: Add description.';


--
-- Name: COLUMN "features"."name"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."features"."name" IS 'TODO: Add description.';


--
-- Name: COLUMN "features"."jira_ticket"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."features"."jira_ticket" IS 'TODO: Add description.';


--
-- Name: COLUMN "features"."description"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."features"."description" IS 'TODO: Add description.';


--
-- Name: COLUMN "features"."is_platform"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."features"."is_platform" IS 'TODO: Add description.';


--
-- Name: COLUMN "features"."is_ready"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."features"."is_ready" IS 'TODO: Add description.';


--
-- Name: COLUMN "features"."created_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."features"."created_at" IS 'TODO: Add description.';


--
-- Name: COLUMN "features"."updated_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."features"."updated_at" IS 'TODO: Add description.';


--
-- Name: COLUMN "features"."is_config"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."features"."is_config" IS 'Indicates if this feature is a configuration change (peer to is_platform)';


--
-- Name: COLUMN "features"."comments"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."features"."comments" IS 'User comments/notes about the feature status';


--
-- Name: COLUMN "features"."dri_member_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."features"."dri_member_id" IS 'TODO: Add description.';


--
-- Name: COLUMN "features"."tenant_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."features"."tenant_id" IS 'TODO: Add description.';


--
-- Name: member_release_state; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."member_release_state" (
    "release_id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "is_ready" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."member_release_state" OWNER TO "postgres";

--
-- Name: TABLE "member_release_state"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."member_release_state" IS 'TODO: Add description.';


--
-- Name: COLUMN "member_release_state"."release_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."member_release_state"."release_id" IS 'TODO: Add description.';


--
-- Name: COLUMN "member_release_state"."member_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."member_release_state"."member_id" IS 'TODO: Add description.';


--
-- Name: COLUMN "member_release_state"."is_ready"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."member_release_state"."is_ready" IS 'TODO: Add description.';


--
-- Name: COLUMN "member_release_state"."created_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."member_release_state"."created_at" IS 'TODO: Add description.';


--
-- Name: COLUMN "member_release_state"."updated_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."member_release_state"."updated_at" IS 'TODO: Add description.';


--
-- Name: COLUMN "member_release_state"."tenant_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."member_release_state"."tenant_id" IS 'TODO: Add description.';


--
-- Name: members; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE "public"."members" OWNER TO "postgres";

--
-- Name: TABLE "members"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."members" IS 'TODO: Add description.';


--
-- Name: COLUMN "members"."id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."members"."id" IS 'TODO: Add description.';


--
-- Name: COLUMN "members"."user_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."members"."user_id" IS 'TODO: Add description.';


--
-- Name: COLUMN "members"."email"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."members"."email" IS 'TODO: Add description.';


--
-- Name: COLUMN "members"."full_name"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."members"."full_name" IS 'TODO: Add description.';


--
-- Name: COLUMN "members"."nickname"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."members"."nickname" IS 'TODO: Add description.';


--
-- Name: COLUMN "members"."member_role"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."members"."member_role" IS 'TODO: Add description.';


--
-- Name: COLUMN "members"."created_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."members"."created_at" IS 'TODO: Add description.';


--
-- Name: COLUMN "members"."updated_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."members"."updated_at" IS 'TODO: Add description.';


--
-- Name: COLUMN "members"."tenant_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."members"."tenant_id" IS 'TODO: Add description.';


--
-- Name: release_teams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."release_teams" (
    "release_id" "uuid" NOT NULL,
    "team_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."release_teams" OWNER TO "postgres";

--
-- Name: TABLE "release_teams"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."release_teams" IS 'TODO: Add description.';


--
-- Name: COLUMN "release_teams"."release_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."release_teams"."release_id" IS 'TODO: Add description.';


--
-- Name: COLUMN "release_teams"."team_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."release_teams"."team_id" IS 'TODO: Add description.';


--
-- Name: COLUMN "release_teams"."created_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."release_teams"."created_at" IS 'TODO: Add description.';


--
-- Name: COLUMN "release_teams"."updated_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."release_teams"."updated_at" IS 'TODO: Add description.';


--
-- Name: COLUMN "release_teams"."tenant_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."release_teams"."tenant_id" IS 'TODO: Add description.';


--
-- Name: releases; Type: TABLE; Schema: public; Owner: postgres
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
    "tenant_id" "uuid" NOT NULL,
    CONSTRAINT "releases_state_check" CHECK (("state" = ANY (ARRAY['pending'::"text", 'ready'::"text", 'past_due'::"text", 'complete'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."releases" OWNER TO "postgres";

--
-- Name: TABLE "releases"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."releases" IS 'TODO: Add description.';


--
-- Name: COLUMN "releases"."id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."releases"."id" IS 'TODO: Add description.';


--
-- Name: COLUMN "releases"."name"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."releases"."name" IS 'TODO: Add description.';


--
-- Name: COLUMN "releases"."target_date"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."releases"."target_date" IS 'TODO: Add description.';


--
-- Name: COLUMN "releases"."platform_update"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."releases"."platform_update" IS 'TODO: Add description.';


--
-- Name: COLUMN "releases"."config_update"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."releases"."config_update" IS 'TODO: Add description.';


--
-- Name: COLUMN "releases"."state"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."releases"."state" IS 'TODO: Add description.';


--
-- Name: COLUMN "releases"."created_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."releases"."created_at" IS 'TODO: Add description.';


--
-- Name: COLUMN "releases"."updated_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."releases"."updated_at" IS 'TODO: Add description.';


--
-- Name: COLUMN "releases"."release_notes"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."releases"."release_notes" IS 'Markdown-formatted release notes for this release';


--
-- Name: COLUMN "releases"."release_summary"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."releases"."release_summary" IS 'TODO: Add description.';


--
-- Name: COLUMN "releases"."is_archived"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."releases"."is_archived" IS 'TODO: Add description.';


--
-- Name: COLUMN "releases"."targets"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."releases"."targets" IS 'Array of target short names associated with this release';


--
-- Name: COLUMN "releases"."tenant_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."releases"."tenant_id" IS 'TODO: Add description.';


--
-- Name: sys_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."sys_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "sys_role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_roles_role_check" CHECK (("sys_role" = ANY (ARRAY['admin'::"text", 'user'::"text"])))
);


ALTER TABLE "public"."sys_roles" OWNER TO "postgres";

--
-- Name: TABLE "sys_roles"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."sys_roles" IS 'TODO: Add description.';


--
-- Name: COLUMN "sys_roles"."id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."sys_roles"."id" IS 'TODO: Add description.';


--
-- Name: COLUMN "sys_roles"."user_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."sys_roles"."user_id" IS 'TODO: Add description.';


--
-- Name: COLUMN "sys_roles"."sys_role"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."sys_roles"."sys_role" IS 'TODO: Add description.';


--
-- Name: COLUMN "sys_roles"."created_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."sys_roles"."created_at" IS 'TODO: Add description.';


--
-- Name: COLUMN "sys_roles"."updated_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."sys_roles"."updated_at" IS 'TODO: Add description.';


--
-- Name: targets; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE "public"."targets" OWNER TO "postgres";

--
-- Name: TABLE "targets"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."targets" IS 'TODO: Add description.';


--
-- Name: COLUMN "targets"."id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."targets"."id" IS 'TODO: Add description.';


--
-- Name: COLUMN "targets"."short_name"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."targets"."short_name" IS 'TODO: Add description.';


--
-- Name: COLUMN "targets"."name"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."targets"."name" IS 'TODO: Add description.';


--
-- Name: COLUMN "targets"."is_live"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."targets"."is_live" IS 'TODO: Add description.';


--
-- Name: COLUMN "targets"."created_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."targets"."created_at" IS 'TODO: Add description.';


--
-- Name: COLUMN "targets"."updated_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."targets"."updated_at" IS 'TODO: Add description.';


--
-- Name: COLUMN "targets"."tenant_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."targets"."tenant_id" IS 'TODO: Add description.';


--
-- Name: team_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "team_id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";

--
-- Name: TABLE "team_members"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."team_members" IS 'TODO: Add description.';


--
-- Name: COLUMN "team_members"."team_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."team_members"."team_id" IS 'TODO: Add description.';


--
-- Name: COLUMN "team_members"."member_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."team_members"."member_id" IS 'TODO: Add description.';


--
-- Name: COLUMN "team_members"."created_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."team_members"."created_at" IS 'TODO: Add description.';


--
-- Name: COLUMN "team_members"."updated_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."team_members"."updated_at" IS 'TODO: Add description.';


--
-- Name: COLUMN "team_members"."tenant_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."team_members"."tenant_id" IS 'TODO: Add description.';


--
-- Name: teams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."teams" OWNER TO "postgres";

--
-- Name: TABLE "teams"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."teams" IS 'TODO: Add description.';


--
-- Name: COLUMN "teams"."id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."teams"."id" IS 'TODO: Add description.';


--
-- Name: COLUMN "teams"."name"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."teams"."name" IS 'TODO: Add description.';


--
-- Name: COLUMN "teams"."description"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."teams"."description" IS 'TODO: Add description.';


--
-- Name: COLUMN "teams"."created_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."teams"."created_at" IS 'TODO: Add description.';


--
-- Name: COLUMN "teams"."updated_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."teams"."updated_at" IS 'TODO: Add description.';


--
-- Name: COLUMN "teams"."tenant_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."teams"."tenant_id" IS 'TODO: Add description.';


--
-- Name: tenant_user_map; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."tenant_user_map" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tenant_user_map" OWNER TO "postgres";

--
-- Name: TABLE "tenant_user_map"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."tenant_user_map" IS 'TODO: Add description.';


--
-- Name: COLUMN "tenant_user_map"."id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."tenant_user_map"."id" IS 'TODO: Add description.';


--
-- Name: COLUMN "tenant_user_map"."tenant_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."tenant_user_map"."tenant_id" IS 'TODO: Add description.';


--
-- Name: COLUMN "tenant_user_map"."user_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."tenant_user_map"."user_id" IS 'TODO: Add description.';


--
-- Name: COLUMN "tenant_user_map"."created_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."tenant_user_map"."created_at" IS 'TODO: Add description.';


--
-- Name: COLUMN "tenant_user_map"."updated_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."tenant_user_map"."updated_at" IS 'TODO: Add description.';


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tenants" OWNER TO "postgres";

--
-- Name: TABLE "tenants"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."tenants" IS 'TODO: Add description.';


--
-- Name: COLUMN "tenants"."id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."tenants"."id" IS 'TODO: Add description.';


--
-- Name: COLUMN "tenants"."name"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."tenants"."name" IS 'TODO: Add description.';


--
-- Name: COLUMN "tenants"."created_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."tenants"."created_at" IS 'TODO: Add description.';


--
-- Name: COLUMN "tenants"."updated_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."tenants"."updated_at" IS 'TODO: Add description.';


--
-- Name: activity_log activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id");


--
-- Name: features features_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."features"
    ADD CONSTRAINT "features_pkey" PRIMARY KEY ("id");


--
-- Name: member_release_state member_release_state_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."member_release_state"
    ADD CONSTRAINT "member_release_state_pkey" PRIMARY KEY ("release_id", "member_id");


--
-- Name: members members_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_email_key" UNIQUE ("email");


--
-- Name: members members_member_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_member_id_key" UNIQUE ("user_id");


--
-- Name: members members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_pkey" PRIMARY KEY ("id");


--
-- Name: release_teams release_teams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."release_teams"
    ADD CONSTRAINT "release_teams_pkey" PRIMARY KEY ("release_id", "team_id");


--
-- Name: releases releases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."releases"
    ADD CONSTRAINT "releases_pkey" PRIMARY KEY ("id");


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("team_id", "member_id");


--
-- Name: teams teams_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_name_key" UNIQUE ("name");


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");


--
-- Name: tenant_user_map tenant_user_map_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tenant_user_map"
    ADD CONSTRAINT "tenant_user_map_pkey" PRIMARY KEY ("id");


--
-- Name: tenant_user_map tenant_user_map_tenant_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tenant_user_map"
    ADD CONSTRAINT "tenant_user_map_tenant_id_user_id_key" UNIQUE ("tenant_id", "user_id");


--
-- Name: tenants tenants_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_name_key" UNIQUE ("name");


--
-- Name: targets tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."targets"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");


--
-- Name: tenants tenants_pkey1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey1" PRIMARY KEY ("id");


--
-- Name: targets tenants_short_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."targets"
    ADD CONSTRAINT "tenants_short_name_key" UNIQUE ("short_name");


--
-- Name: sys_roles uroles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."sys_roles"
    ADD CONSTRAINT "uroles_pkey" PRIMARY KEY ("id");


--
-- Name: sys_roles uroles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."sys_roles"
    ADD CONSTRAINT "uroles_user_id_key" UNIQUE ("user_id");


--
-- Name: idx_activity_log_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_activity_log_tenant_id" ON "public"."activity_log" USING "btree" ("tenant_id");


--
-- Name: idx_features_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_features_tenant_id" ON "public"."features" USING "btree" ("tenant_id");


--
-- Name: idx_member_release_state_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_member_release_state_tenant_id" ON "public"."member_release_state" USING "btree" ("tenant_id");


--
-- Name: idx_members_member_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_members_member_role" ON "public"."members" USING "btree" ("member_role");


--
-- Name: idx_members_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_members_tenant_id" ON "public"."members" USING "btree" ("tenant_id");


--
-- Name: idx_release_teams_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_release_teams_tenant_id" ON "public"."release_teams" USING "btree" ("tenant_id");


--
-- Name: idx_releases_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_releases_tenant_id" ON "public"."releases" USING "btree" ("tenant_id");


--
-- Name: idx_sys_roles_sys_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_sys_roles_sys_role" ON "public"."sys_roles" USING "btree" ("sys_role");


--
-- Name: idx_targets_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_targets_tenant_id" ON "public"."targets" USING "btree" ("tenant_id");


--
-- Name: idx_team_members_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_team_members_tenant_id" ON "public"."team_members" USING "btree" ("tenant_id");


--
-- Name: idx_teams_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_teams_tenant_id" ON "public"."teams" USING "btree" ("tenant_id");


--
-- Name: idx_tenant_user_map_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_tenant_user_map_created_at" ON "public"."tenant_user_map" USING "btree" ("created_at");


--
-- Name: idx_tenant_user_map_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_tenant_user_map_tenant_id" ON "public"."tenant_user_map" USING "btree" ("tenant_id");


--
-- Name: idx_tenant_user_map_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_tenant_user_map_user_id" ON "public"."tenant_user_map" USING "btree" ("user_id");


--
-- Name: idx_uroles_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_uroles_user_id" ON "public"."sys_roles" USING "btree" ("user_id");


--
-- Name: activity_log set_activity_log_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_activity_log_updated_at" BEFORE UPDATE ON "public"."activity_log" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: features set_features_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_features_updated_at" BEFORE UPDATE ON "public"."features" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: member_release_state set_member_release_state_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_member_release_state_updated_at" BEFORE UPDATE ON "public"."member_release_state" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: members set_members_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_members_updated_at" BEFORE UPDATE ON "public"."members" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: release_teams set_release_teams_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_release_teams_updated_at" BEFORE UPDATE ON "public"."release_teams" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: releases set_releases_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_releases_updated_at" BEFORE UPDATE ON "public"."releases" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: targets set_targets_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_targets_updated_at" BEFORE UPDATE ON "public"."targets" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: team_members set_team_members_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_team_members_updated_at" BEFORE UPDATE ON "public"."team_members" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: teams set_teams_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_teams_updated_at" BEFORE UPDATE ON "public"."teams" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: tenant_user_map set_tenant_user_map_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_tenant_user_map_updated_at" BEFORE UPDATE ON "public"."tenant_user_map" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: tenants set_tenants_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_tenants_updated_at" BEFORE UPDATE ON "public"."tenants" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: sys_roles update_uroles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "update_uroles_updated_at" BEFORE UPDATE ON "public"."sys_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: activity_log activity_log_feature_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE CASCADE;


--
-- Name: activity_log activity_log_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE SET NULL;


--
-- Name: activity_log activity_log_release_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE CASCADE;


--
-- Name: activity_log activity_log_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;


--
-- Name: activity_log activity_log_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;


--
-- Name: features features_dri_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."features"
    ADD CONSTRAINT "features_dri_member_id_fkey" FOREIGN KEY ("dri_member_id") REFERENCES "public"."members"("id") ON DELETE SET NULL;


--
-- Name: features features_release_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."features"
    ADD CONSTRAINT "features_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE CASCADE;


--
-- Name: features features_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."features"
    ADD CONSTRAINT "features_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;


--
-- Name: member_release_state member_release_state_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."member_release_state"
    ADD CONSTRAINT "member_release_state_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE SET NULL;


--
-- Name: member_release_state member_release_state_release_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."member_release_state"
    ADD CONSTRAINT "member_release_state_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE CASCADE;


--
-- Name: member_release_state member_release_state_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."member_release_state"
    ADD CONSTRAINT "member_release_state_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;


--
-- Name: members members_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;


--
-- Name: release_teams release_teams_release_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."release_teams"
    ADD CONSTRAINT "release_teams_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE CASCADE;


--
-- Name: release_teams release_teams_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."release_teams"
    ADD CONSTRAINT "release_teams_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;


--
-- Name: release_teams release_teams_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."release_teams"
    ADD CONSTRAINT "release_teams_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;


--
-- Name: releases releases_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."releases"
    ADD CONSTRAINT "releases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;


--
-- Name: targets targets_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."targets"
    ADD CONSTRAINT "targets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;


--
-- Name: team_members team_members_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE SET NULL;


--
-- Name: team_members team_members_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;


--
-- Name: team_members team_members_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;


--
-- Name: teams teams_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;


--
-- Name: tenant_user_map tenant_user_map_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tenant_user_map"
    ADD CONSTRAINT "tenant_user_map_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;


--
-- Name: tenant_user_map tenant_user_map_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tenant_user_map"
    ADD CONSTRAINT "tenant_user_map_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."members"("user_id") ON DELETE CASCADE;


--
-- Name: activity_log Allow all authenticated users full access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all authenticated users full access" ON "public"."activity_log" USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: features Allow all authenticated users full access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all authenticated users full access" ON "public"."features" USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: member_release_state Allow all authenticated users full access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all authenticated users full access" ON "public"."member_release_state" USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: members Allow all authenticated users full access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all authenticated users full access" ON "public"."members" USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: release_teams Allow all authenticated users full access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all authenticated users full access" ON "public"."release_teams" USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: releases Allow all authenticated users full access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all authenticated users full access" ON "public"."releases" USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: team_members Allow all authenticated users full access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all authenticated users full access" ON "public"."team_members" USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: teams Allow all authenticated users full access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all authenticated users full access" ON "public"."teams" USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: features Authenticated users can read features; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can read features" ON "public"."features" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: members Members can delete member records; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Members can delete member records" ON "public"."members" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: teams Members can delete teams; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Members can delete teams" ON "public"."teams" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: teams Members can insert teams; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Members can insert teams" ON "public"."teams" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: members Members can update member records; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Members can update member records" ON "public"."members" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: teams Members can update teams; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Members can update teams" ON "public"."teams" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: teams Members can view all teams; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Members can view all teams" ON "public"."teams" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: targets Users can delete targets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete targets" ON "public"."targets" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: tenant_user_map Users can delete tenant user mappings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete tenant user mappings" ON "public"."tenant_user_map" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: tenants Users can delete tenants; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete tenants" ON "public"."tenants" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: sys_roles Users can insert roles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert roles" ON "public"."sys_roles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: targets Users can insert targets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert targets" ON "public"."targets" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: tenant_user_map Users can insert tenant user mappings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert tenant user mappings" ON "public"."tenant_user_map" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: tenants Users can insert tenants; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert tenants" ON "public"."tenants" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: sys_roles Users can read their own role; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read their own role" ON "public"."sys_roles" FOR SELECT USING (("auth"."uid"() = "user_id"));


--
-- Name: targets Users can update targets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update targets" ON "public"."targets" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: tenant_user_map Users can update tenant user mappings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update tenant user mappings" ON "public"."tenant_user_map" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: tenants Users can update tenants; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update tenants" ON "public"."tenants" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: sys_roles Users can update their own role; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own role" ON "public"."sys_roles" FOR UPDATE USING (("auth"."uid"() = "user_id"));


--
-- Name: targets Users can view all targets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view all targets" ON "public"."targets" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: tenants Users can view all tenants; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view all tenants" ON "public"."tenants" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: tenant_user_map Users can view tenant user mappings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view tenant user mappings" ON "public"."tenant_user_map" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: activity_log; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."activity_log" ENABLE ROW LEVEL SECURITY;

--
-- Name: features; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."features" ENABLE ROW LEVEL SECURITY;

--
-- Name: member_release_state; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."member_release_state" ENABLE ROW LEVEL SECURITY;

--
-- Name: members; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."members" ENABLE ROW LEVEL SECURITY;

--
-- Name: release_teams; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."release_teams" ENABLE ROW LEVEL SECURITY;

--
-- Name: releases; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."releases" ENABLE ROW LEVEL SECURITY;

--
-- Name: sys_roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."sys_roles" ENABLE ROW LEVEL SECURITY;

--
-- Name: targets; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."targets" ENABLE ROW LEVEL SECURITY;

--
-- Name: team_members; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_user_map; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."tenant_user_map" ENABLE ROW LEVEL SECURITY;

--
-- Name: tenants; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA "public"; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


--
-- Name: FUNCTION "create_member_from_auth_user"("auth_user_id" "uuid", "nickname" "text", "member_role" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_member_from_auth_user"("auth_user_id" "uuid", "nickname" "text", "member_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_member_from_auth_user"("auth_user_id" "uuid", "nickname" "text", "member_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_member_from_auth_user"("auth_user_id" "uuid", "nickname" "text", "member_role" "text") TO "service_role";


--
-- Name: FUNCTION "get_auth_users_by_email"("email_substring" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_auth_users_by_email"("email_substring" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_auth_users_by_email"("email_substring" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_auth_users_by_email"("email_substring" "text") TO "service_role";


--
-- Name: FUNCTION "get_user_role"("user_uuid" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_user_role"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"("user_uuid" "uuid") TO "service_role";


--
-- Name: FUNCTION "is_admin"("user_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "set_updated_at"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


--
-- Name: FUNCTION "set_user_role"("user_uuid" "uuid", "new_role" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."set_user_role"("user_uuid" "uuid", "new_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."set_user_role"("user_uuid" "uuid", "new_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_user_role"("user_uuid" "uuid", "new_role" "text") TO "service_role";


--
-- Name: FUNCTION "update_updated_at_column"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


--
-- Name: TABLE "activity_log"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."activity_log" TO "anon";
GRANT ALL ON TABLE "public"."activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log" TO "service_role";


--
-- Name: TABLE "features"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."features" TO "anon";
GRANT ALL ON TABLE "public"."features" TO "authenticated";
GRANT ALL ON TABLE "public"."features" TO "service_role";


--
-- Name: TABLE "member_release_state"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."member_release_state" TO "anon";
GRANT ALL ON TABLE "public"."member_release_state" TO "authenticated";
GRANT ALL ON TABLE "public"."member_release_state" TO "service_role";


--
-- Name: TABLE "members"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."members" TO "anon";
GRANT ALL ON TABLE "public"."members" TO "authenticated";
GRANT ALL ON TABLE "public"."members" TO "service_role";


--
-- Name: TABLE "release_teams"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."release_teams" TO "anon";
GRANT ALL ON TABLE "public"."release_teams" TO "authenticated";
GRANT ALL ON TABLE "public"."release_teams" TO "service_role";


--
-- Name: TABLE "releases"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."releases" TO "anon";
GRANT ALL ON TABLE "public"."releases" TO "authenticated";
GRANT ALL ON TABLE "public"."releases" TO "service_role";


--
-- Name: TABLE "sys_roles"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."sys_roles" TO "anon";
GRANT ALL ON TABLE "public"."sys_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."sys_roles" TO "service_role";


--
-- Name: TABLE "targets"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."targets" TO "anon";
GRANT ALL ON TABLE "public"."targets" TO "authenticated";
GRANT ALL ON TABLE "public"."targets" TO "service_role";


--
-- Name: TABLE "team_members"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";


--
-- Name: TABLE "teams"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";


--
-- Name: TABLE "tenant_user_map"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."tenant_user_map" TO "anon";
GRANT ALL ON TABLE "public"."tenant_user_map" TO "authenticated";
GRANT ALL ON TABLE "public"."tenant_user_map" TO "service_role";


--
-- Name: TABLE "tenants"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


--
-- PostgreSQL database dump complete
--

RESET ALL;
