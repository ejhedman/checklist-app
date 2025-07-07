-- Create User Roles Table Migration
-- This script creates a user_roles table to map app-specific roles to Supabase auth users

-- STEP 1: Create the user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique, -- References Supabase auth.users.id
  role text not null check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- STEP 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- STEP 3: Create trigger for updated_at
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    -- Drop trigger if it exists to avoid conflicts
    DROP TRIGGER IF EXISTS set_user_roles_updated_at ON user_roles;
    -- Create the trigger
    CREATE TRIGGER set_user_roles_updated_at BEFORE UPDATE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- STEP 4: Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- STEP 5: Create RLS policies
DROP POLICY IF EXISTS "Users can view user roles" ON user_roles;
CREATE POLICY "Users can view user roles" ON user_roles
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can manage user roles" ON user_roles;
CREATE POLICY "Users can manage user roles" ON user_roles
FOR ALL USING (auth.role() = 'authenticated');

-- STEP 6: Create a function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid uuid)
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM user_roles 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 7: Create a function to set user role
CREATE OR REPLACE FUNCTION set_user_role(user_uuid uuid, new_role text)
RETURNS void AS $$
BEGIN
  INSERT INTO user_roles (user_id, role)
  VALUES (user_uuid, new_role)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    role = EXCLUDED.role,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 8: Verify the table was created
SELECT 
  'User Roles Table Created' as status,
  (SELECT COUNT(*) FROM user_roles) as total_user_roles;

-- STEP 9: Show table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_roles' 
ORDER BY ordinal_position; 