-- Migration: Add summary column to features table
-- Date: 2024-12-21
-- Description: Adds a summary column to the features table for a short summary of the feature

ALTER TABLE "public"."features"
ADD COLUMN "summary" text;

COMMENT ON COLUMN "public"."features"."summary" IS 'Short summary of the feature (optional)'; 