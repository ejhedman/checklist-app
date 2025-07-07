-- Feature Schema Update Migration
-- Add is_config and comments fields to features table
-- Run this in your Supabase SQL editor

-- Add is_config column (peer to is_platform)
ALTER TABLE features 
ADD COLUMN is_config boolean NOT NULL DEFAULT false;

-- Add comments column for feature notes
ALTER TABLE features 
ADD COLUMN comments text;

-- Update the trigger to include the new columns
DROP TRIGGER IF EXISTS set_features_updated_at ON features;
CREATE TRIGGER set_features_updated_at 
  BEFORE UPDATE ON features
  FOR EACH ROW 
  EXECUTE PROCEDURE set_updated_at();

-- Add comments to the migration log
COMMENT ON COLUMN features.is_config IS 'Indicates if this feature is a configuration change (peer to is_platform)';
COMMENT ON COLUMN features.comments IS 'User comments/notes about the feature status';

-- Add release_summary column to releases table
ALTER TABLE releases ADD COLUMN release_summary text;

-- Add is_archived column to releases table
ALTER TABLE releases ADD COLUMN is_archived boolean NOT NULL DEFAULT false; 