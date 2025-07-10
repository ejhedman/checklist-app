-- Migration: Update members table constraints for email and nickname
-- Date: 2024-07-09

-- Step 1: Drop the unique constraint on email if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'members' 
      AND constraint_type = 'UNIQUE' 
      AND constraint_name = 'members_email_key'
  ) THEN
    ALTER TABLE "public"."members" DROP CONSTRAINT "members_email_key";
  END IF;
END $$;

-- Step 2: Add a unique constraint on (project_id, nickname) where nickname is not null
CREATE UNIQUE INDEX IF NOT EXISTS members_project_id_nickname_key
  ON "public"."members" (project_id, nickname)
  WHERE nickname IS NOT NULL; 