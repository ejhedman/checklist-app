-- Migration: Update create_member_from_auth_user function and ensure proper column names
-- Date: 2024-12-24
-- Description: Update the function to handle project_id parameter and ensure database is in correct state

-- Step 1: Ensure tenant_id columns are renamed to project_id (if not already done)
DO $$
BEGIN
  -- Check if members table has tenant_id column and rename it to project_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'members' 
      AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE "public"."members" RENAME COLUMN "tenant_id" TO "project_id";
  END IF;
  
  -- Check if other tables need renaming
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'activity_log' 
      AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE "public"."activity_log" RENAME COLUMN "tenant_id" TO "project_id";
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'features' 
      AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE "public"."features" RENAME COLUMN "tenant_id" TO "project_id";
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'member_release_state' 
      AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE "public"."member_release_state" RENAME COLUMN "tenant_id" TO "project_id";
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'release_teams' 
      AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE "public"."release_teams" RENAME COLUMN "tenant_id" TO "project_id";
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'releases' 
      AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE "public"."releases" RENAME COLUMN "tenant_id" TO "project_id";
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'targets' 
      AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE "public"."targets" RENAME COLUMN "tenant_id" TO "project_id";
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'team_members' 
      AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE "public"."team_members" RENAME COLUMN "tenant_id" TO "project_id";
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'teams' 
      AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE "public"."teams" RENAME COLUMN "tenant_id" TO "project_id";
  END IF;
  
  -- Rename tenant_user_map to project_user_map if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'tenant_user_map'
  ) THEN
    ALTER TABLE "public"."tenant_user_map" RENAME TO "project_user_map";
  END IF;
  
  -- Rename tenants to projects if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'tenants'
  ) THEN
    ALTER TABLE "public"."tenants" RENAME TO "projects";
  END IF;
  
  -- Rename tenant_id to project_id in project_user_map if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'project_user_map' 
      AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE "public"."project_user_map" RENAME COLUMN "tenant_id" TO "project_id";
  END IF;
END $$;

-- Step 2: Drop the old function if it exists (with any parameter signature)
DROP FUNCTION IF EXISTS public.create_member_from_auth_user(uuid, text, text);
DROP FUNCTION IF EXISTS public.create_member_from_auth_user(uuid, uuid, text, text);

-- Step 3: Recreate the function with the correct signature and parameter names
CREATE OR REPLACE FUNCTION public.create_member_from_auth_user(
    auth_user_id uuid,
    project_id uuid,
    nickname text DEFAULT NULL,
    member_role text DEFAULT 'member'
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  member_user_id uuid;
BEGIN
  -- Get auth user details
  SELECT 
    au.id
  INTO member_user_id
  FROM auth.users au
  WHERE au.id = auth_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auth user not found';
  END IF;

  -- Insert into members table using project_id column
  INSERT INTO members (id, user_id, email, full_name, nickname, member_role, project_id)
  VALUES (
    gen_random_uuid(),
    auth_user_id,
    (SELECT email FROM auth.users WHERE id = auth_user_id),
    (SELECT COALESCE(raw_user_meta_data->>'full_name', email) FROM auth.users WHERE id = auth_user_id),
    nickname,
    member_role,
    (select project_id)
  )
  -- ON CONFLICT (user_id, project_id) DO UPDATE SET
  --   nickname = EXCLUDED.nickname,
  --   member_role = EXCLUDED.member_role,
  --   updated_at = now()
  RETURNING user_id INTO member_user_id;

  RETURN member_user_id;
END;
$$;
