-- Migration: Add is_deployed column to releases table
-- Date: 2024-12-19
-- Description: Adds a boolean flag to track deployment status of releases

-- Add the is_deployed column to the releases table
ALTER TABLE "public"."releases" 
ADD COLUMN "is_deployed" boolean DEFAULT false NOT NULL;

-- Add comment for the new column
COMMENT ON COLUMN "public"."releases"."is_deployed" IS 'Indicates whether the release has been deployed to production'; 


-- Add the is_deployed column to the releases table
ALTER TABLE "public"."releases" 
ADD COLUMN "is_cancelled" boolean DEFAULT false NOT NULL;

-- Add comment for the new column
COMMENT ON COLUMN "public"."releases"."is_deployed" IS 'Indicates whether the release has been cancelled'; 