-- Fix Trigger Error Script
-- This script resolves the "trigger already exists" error

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS set_user_roles_updated_at ON user_roles;

-- Recreate the trigger
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    CREATE TRIGGER set_user_roles_updated_at BEFORE UPDATE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- Verify the trigger was created
SELECT 
  'Trigger Fixed' as status,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'set_user_roles_updated_at'; 