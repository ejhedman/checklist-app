-- Rename uroles table to uroles and update related objects

-- Step 1: Rename the table
ALTER TABLE uroles RENAME TO uroles;

-- Step 2: Rename indexes (if any)
DO $$
DECLARE
    idx RECORD;
BEGIN
    FOR idx IN SELECT indexname FROM pg_indexes WHERE tablename = 'uroles' AND indexname LIKE '%uroles%' LOOP
        EXECUTE format('ALTER INDEX %I RENAME TO %I', idx.indexname, replace(idx.indexname, 'uroles', 'uroles'));
    END LOOP;
END $$;

-- Step 3: Rename triggers (if any)
DO $$
DECLARE
    trig RECORD;
BEGIN
    FOR trig IN SELECT tgname FROM pg_trigger WHERE tgrelid = 'uroles'::regclass AND tgname LIKE '%uroles%' LOOP
        EXECUTE format('ALTER TRIGGER %I ON uroles RENAME TO %I', trig.tgname, replace(trig.tgname, 'uroles', 'uroles'));
    END LOOP;
END $$;

-- Step 4: Rename policies (if any)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'uroles' AND policyname LIKE '%uroles%' LOOP
        EXECUTE format('ALTER POLICY %I ON uroles RENAME TO %I', pol.policyname, replace(pol.policyname, 'uroles', 'uroles'));
    END LOOP;
END $$;

-- Step 5: Update helper functions if they reference the old table name
-- (You may need to drop and recreate them if they use the old table name)
-- Example for get_user_role:
DROP FUNCTION IF EXISTS get_user_role(uuid);
CREATE OR REPLACE FUNCTION get_user_role(user_uuid uuid DEFAULT auth.uid())
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM uroles 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example for set_user_role:
DROP FUNCTION IF EXISTS set_user_role(uuid, text);
CREATE OR REPLACE FUNCTION set_user_role(user_uuid uuid, new_role text)
RETURNS void AS $$
BEGIN
  INSERT INTO uroles (user_id, role)
  VALUES (user_uuid, new_role)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    role = EXCLUDED.role,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 