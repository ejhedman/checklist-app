-- Migration: Add feature_type column to features table
-- Date: 2024-12-21
-- Description: Adds a feature_type column to the features table to categorize features as "feature", "bug", or "nfr"

-- Add the feature_type column with default value "feature"
ALTER TABLE "public"."features" 
ADD COLUMN "feature_type" "text" NOT NULL DEFAULT 'feature';

-- Add a check constraint to ensure feature_type only accepts valid values
ALTER TABLE "public"."features" 
ADD CONSTRAINT "features_feature_type_check" 
CHECK ("feature_type" IN ('feature', 'bug', 'nfr'));

-- Add comment for the new column
COMMENT ON COLUMN "public"."features"."feature_type" IS 'Type of the feature: feature, bug, or nfr (non-functional requirement)'; 