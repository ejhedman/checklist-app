-- Migration: Add is_ready field to releases table
-- Date: 2024-12-20
-- Description: Add is_ready boolean field to releases table with default value false

-- Add is_ready column to releases table
ALTER TABLE IF EXISTS "public"."releases" 
ADD COLUMN "is_ready" boolean NOT NULL DEFAULT false;

-- Add comment for the new column
COMMENT ON COLUMN "public"."releases"."is_ready" IS 'Indicates whether the release is ready for deployment'; 