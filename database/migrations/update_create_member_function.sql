-- Update create_member_from_auth_user function to include tenant_id
-- Drop the old function and create a new one with tenant_id parameter

DROP FUNCTION IF EXISTS "public"."create_member_from_auth_user"("auth_user_id" "uuid", "nickname" "text", "member_role" "text");

CREATE OR REPLACE FUNCTION "public"."create_member_from_auth_user"(
  "auth_user_id" "uuid", 
  "nickname" "text" DEFAULT NULL::"text", 
  "member_role" "text" DEFAULT 'member'::"text",
  "tenant_id" "uuid" DEFAULT NULL::"uuid"
) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  member_user_id uuid;
  target_tenant_id uuid;
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

  -- If tenant_id is not provided, get the default tenant (DWH)
  IF tenant_id IS NULL THEN
    SELECT id INTO target_tenant_id FROM tenants WHERE name = 'DWH' LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Default tenant (DWH) not found';
    END IF;
  ELSE
    target_tenant_id := tenant_id;
  END IF;
  
  -- Insert into members table using member_role column
  INSERT INTO members (id, user_id, email, full_name, nickname, member_role, tenant_id)
  VALUES (
    gen_random_uuid(),
    auth_user_id,
    (SELECT email FROM auth.users WHERE id = auth_user_id),
    (SELECT COALESCE(raw_user_meta_data->>'full_name', email) FROM auth.users WHERE id = auth_user_id),
    nickname,
    member_role,
    target_tenant_id
  )
  ON CONFLICT (user_id) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    member_role = EXCLUDED.member_role,
    tenant_id = EXCLUDED.tenant_id,
    updated_at = now()
  RETURNING user_id INTO member_user_id;
  
  RETURN member_user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION "public"."create_member_from_auth_user"("auth_user_id" "uuid", "nickname" "text", "member_role" "text", "tenant_id" "uuid") TO "authenticated"; 