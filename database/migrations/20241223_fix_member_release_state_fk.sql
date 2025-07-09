-- Fix member_release_state and team_members foreign key constraints
-- The member_id columns are NOT NULL but the FKs were set to ON DELETE SET NULL
-- These should be ON DELETE CASCADE instead

-- Fix member_release_state foreign key constraint
ALTER TABLE "public"."member_release_state" 
DROP CONSTRAINT "member_release_state_member_id_fkey";

ALTER TABLE "public"."member_release_state"
ADD CONSTRAINT "member_release_state_member_id_fkey" 
FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;

-- Fix team_members foreign key constraint
ALTER TABLE "public"."team_members" 
DROP CONSTRAINT "team_members_member_id_fkey";

ALTER TABLE "public"."team_members"
ADD CONSTRAINT "team_members_member_id_fkey" 
FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE CASCADE; 