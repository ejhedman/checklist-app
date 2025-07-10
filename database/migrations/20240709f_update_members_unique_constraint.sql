-- Migration: Update unique constraint on members table to (project_id, user_id)
-- Date: 2024-07-09

-- Step 1: Drop the old unique constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'members' 
      AND constraint_type = 'UNIQUE' 
      AND constraint_name = 'members_member_id_key'
  ) THEN
    ALTER TABLE "public"."members" DROP CONSTRAINT "members_member_id_key";
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'members' 
      AND constraint_type = 'UNIQUE' 
      AND constraint_name = 'members_user_id_key'
  ) THEN
    ALTER TABLE "public"."members" DROP CONSTRAINT "members_user_id_key";
  END IF;
END $$;

-- Step 2: Add the correct unique constraint
ALTER TABLE "public"."members"
  ADD CONSTRAINT "members_project_id_user_id_key" UNIQUE (project_id, user_id); 