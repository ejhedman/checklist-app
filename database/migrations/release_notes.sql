-- Add release_notes column to releases table
ALTER TABLE releases
ADD COLUMN release_notes text;

-- Optionally, add a comment for clarity
COMMENT ON COLUMN releases.release_notes IS 'Markdown-formatted release notes for this release';