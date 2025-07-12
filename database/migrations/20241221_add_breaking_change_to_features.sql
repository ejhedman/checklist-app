-- Migration: Add breaking_change column to features table
-- Date: 2024-12-21
-- Description: Adds a breaking_change column to the features table to indicate if a feature introduces breaking changes

-- Add the breaking_change column with default value false
ALTER TABLE "public"."features" 
ADD COLUMN "breaking_change" boolean NOT NULL DEFAULT false;

-- Add comment for the new column
COMMENT ON COLUMN "public"."features"."breaking_change" IS 'Indicates if this feature introduces breaking changes that require special attention'; 