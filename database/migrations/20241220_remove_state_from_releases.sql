-- Migration: Remove state field from releases table
-- Date: 2024-12-20
-- Description: Remove the state field from releases table since state is now dynamically computed

-- Remove the state column from releases table
ALTER TABLE "public"."releases" DROP COLUMN "state";

-- Remove the state check constraint
ALTER TABLE "public"."releases" DROP CONSTRAINT IF EXISTS "releases_state_check";

-- Remove the comment on the state column
COMMENT ON COLUMN "public"."releases"."state" IS NULL; 